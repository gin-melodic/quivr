import {BrainType, Model, PaidModels} from "../context/BrainConfigProvider/types";

export const defineMaxTokens = (model: Model | PaidModels, brainType: BrainType = 'openai'): number => {
  if (brainType === "chatglm2-6b") {
    return 8192;
  }

  //At the moment is evaluating only models from OpenAI
  switch (model) {
    case "gpt-3.5-turbo":
      return 500;
    case "gpt-3.5-turbo-16k":
      return 2000;
    case "gpt-4":
      return 1000;
    default:
      return 250;
  }
};

export const defineDefaultMaxTokens = (model: Model | PaidModels, brainType: BrainType = 'openai'): number => {
  if (brainType === 'chatglm2-6b') {
    return 8192;
  }

  return defineMaxTokens(model, brainType);
}
