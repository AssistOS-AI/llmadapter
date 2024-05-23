import ITextLLM from "../../../interfaces/ITextLLM.js";

class GPT4 extends ITextLLM{
    static modelName = "gpt-4";
    constructor(APIKey,config) {
        super(APIKey,config)
    }
    getModelName(){
        return GPT4.modelName;
    }
}
export default GPT4;