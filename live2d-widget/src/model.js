import showMessage from "./message.js";
import randomSelection from "./utils.js";

class Model {
    constructor(config) {
        let { apiPath, cdnPath } = config;
        let useCDN = false;
        if (typeof cdnPath === "string") {
            useCDN = true;
            if (!cdnPath.endsWith("/")) cdnPath += "/";
        } else if (typeof apiPath === "string") {
            if (!apiPath.endsWith("/")) apiPath += "/";
        } else {
            throw "Invalid initWidget argument!";
        }
        this.useCDN = useCDN;
        this.apiPath = apiPath;
        this.cdnPath = cdnPath;
    }

    async loadModelList() {
        const response = await fetch(`${this.cdnPath}model_list.json`);
        if (!response.ok) throw new Error(`Failed to load model list (${response.status})`);
        this.modelList = await response.json();
    }

    setLoading(loading) {
        const canvas = document.getElementById("live2d");
        const waifu = document.getElementById("waifu");
        if (canvas) canvas.style.visibility = loading ? "hidden" : "visible";
        if (waifu) waifu.toggleAttribute("data-live2d-loading", loading);
    }

    async preloadResource(url, type) {
        const response = await fetch(url, { cache: "force-cache" });
        if (!response.ok) throw new Error(`Failed to load ${type} (${response.status})`);
        if (type === "texture") {
            const blob = await response.blob();
            const image = new Image();
            image.decoding = "async";
            image.src = URL.createObjectURL(blob);
            try {
                if (typeof image.decode === "function") await image.decode();
                else await new Promise((resolve, reject) => {
                    image.onload = resolve;
                    image.onerror = reject;
                });
            } finally {
                URL.revokeObjectURL(image.src);
            }
        } else {
            await response.arrayBuffer();
        }
    }

    async preloadTarget(target) {
        const indexUrl = `${this.cdnPath}model/${target}/index.json`;
        const response = await fetch(indexUrl, { cache: "force-cache" });
        if (!response.ok) throw new Error(`Failed to load model settings (${response.status})`);
        const setting = await response.json();
        const resolve = file => new URL(file, indexUrl).href;
        await this.preloadResource(resolve(setting.model), "model");
        const textures = Array.isArray(setting.textures) ? setting.textures : [];
        await Promise.all(textures.map(texture => this.preloadResource(resolve(texture), "texture")));
        return indexUrl;
    }

    async loadTarget(target, message) {
        this.setLoading(true);
        let lastError;
        for (let attempt = 0; attempt < 2; attempt += 1) {
            try {
                const indexUrl = await this.preloadTarget(target);
                loadlive2d("live2d", indexUrl);
                localStorage.setItem("live2dLastTarget", target);
                window.setTimeout(() => this.setLoading(false), 350);
                showMessage(message, 4000, 10);
                return;
            } catch (error) {
                lastError = error;
            }
        }

        const fallback = localStorage.getItem("live2dLastTarget");
        if (fallback && fallback !== target) {
            try {
                const indexUrl = await this.preloadTarget(fallback);
                loadlive2d("live2d", indexUrl);
                window.setTimeout(() => this.setLoading(false), 350);
                showMessage(message, 4000, 10);
                return;
            } catch (error) {
                lastError = error;
            }
        }

        this.setLoading(false);
        throw lastError || new Error("Live2D model failed to load");
    }

    async loadModel(modelId, modelTexturesId, message) {
        localStorage.setItem("modelId", modelId);
        localStorage.setItem("modelTexturesId", modelTexturesId);
        if (this.useCDN) {
            if (!this.modelList) await this.loadModelList();
            const target = randomSelection(this.modelList.models[modelId]);
            await this.loadTarget(target, message);
        } else {
            showMessage(message, 4000, 10);
            loadlive2d("live2d", `${this.apiPath}get/?id=${modelId}-${modelTexturesId}`);
            console.log(`Live2D 模型 ${modelId}-${modelTexturesId} 加载完成`);
        }
    }

    async loadRandModel() {
        const modelId = localStorage.getItem("modelId"),
            modelTexturesId = localStorage.getItem("modelTexturesId");
        if (this.useCDN) {
            if (!this.modelList) await this.loadModelList();
            const target = randomSelection(this.modelList.models[modelId]);
            await this.loadTarget(target, "我的新衣服好看吗？");
        } else {
            // 可选 "rand"(随机), "switch"(顺序)
            fetch(`${this.apiPath}rand_textures/?id=${modelId}-${modelTexturesId}`)
                .then(response => response.json())
                .then(result => {
                    if (result.textures.id === 1 && (modelTexturesId === 1 || modelTexturesId === 0)) showMessage("我还没有其他衣服呢！", 4000, 10);
                    else this.loadModel(modelId, result.textures.id, "我的新衣服好看吗？");
                });
        }
    }

    async loadOtherModel() {
        let modelId = localStorage.getItem("modelId");
        if (this.useCDN) {
            if (!this.modelList) await this.loadModelList();
            const index = (++modelId >= this.modelList.models.length) ? 0 : modelId;
            this.loadModel(index, 0, this.modelList.messages[index]);
        } else {
            fetch(`${this.apiPath}switch/?id=${modelId}`)
                .then(response => response.json())
                .then(result => {
                    this.loadModel(result.model.id, 0, result.model.message);
                });
        }
    }
}

export default Model;
