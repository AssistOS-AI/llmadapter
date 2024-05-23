import  ITextLLM from "../../../interfaces/ITextLLM.js";

class Claude3 extends ITextLLM{
    static modelName="claude-3-opus-20240229";
    constructor(APIKey,config) {
        super(APIKey,config);
    }
    getModelName(){
        return Claude3.modelName;
    }
}
export default Claude3;