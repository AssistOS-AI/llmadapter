import ITextLLM from "../../../interfaces/ITextLLM.js";

class Claude2 extends ITextLLM {
    static modelName = "claude-2.1";

    constructor(APIKey, config) {
        super(APIKey, config);
    }

    getModelName() {
        return Claude2.modelName;
    }
}
export default Claude2;