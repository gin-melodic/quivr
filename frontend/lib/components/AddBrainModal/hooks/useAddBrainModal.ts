/* eslint-disable max-lines */
import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useBrainApi } from "@/lib/api/brain/useBrainApi";
import { usePromptApi } from "@/lib/api/prompt/usePromptApi";
import { useBrainConfig } from "@/lib/context/BrainConfigProvider";
import { useBrainContext } from "@/lib/context/BrainProvider/hooks/useBrainContext";
import { defineMaxTokens } from "@/lib/helpers/defineMaxTokens";
import { useToast } from "@/lib/hooks";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const useAddBrainModal = () => {
  const { t } = useTranslation(["translation", "brain", "config"]);
  const [isPending, setIsPending] = useState(false);
  const { publish } = useToast();
  const { createBrain, setActiveBrain } = useBrainContext();
  const { setAsDefaultBrain } = useBrainApi();
  const { createPrompt } = usePromptApi();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { config } = useBrainConfig();
  const defaultValues = {
    ...config,
    name: "",
    description: "",
    setDefault: false,
    prompt: {
      title: "",
      content: "",
    },
  };

  const { register, getValues, reset, watch, setValue } = useForm({
    defaultValues,
  });

  const openAiKey = watch("openAiKey");
  const model = watch("model");
  const brainType = watch("brainType");
  const brainUrl = watch("brainUrl");
  const topP = watch("topP");
  const temperature = watch("temperature");
  const maxTokens = watch("maxTokens");

  useEffect(() => {
    setValue("maxTokens", Math.min(maxTokens, defineMaxTokens(model, brainType)));
  }, [maxTokens, model, setValue, brainType]);

  useEffect(() => {
    if (brainType === 'chatglm2-6b') {
      setValue("temperature", 0.85)
      setValue("topP", 0.8)
    }
  }, [setValue, brainType])

  const getCreatingBrainPromptId = async (): Promise<string | undefined> => {
    const { prompt } = getValues();

    if (prompt.title.trim() !== "" && prompt.content.trim() !== "") {
      return (await createPrompt(prompt)).id;
    }

    return undefined;
  };

  const handleSubmit = async () => {
    const { name, description, setDefault } = getValues();

    if (isPending || name.trim() === "") {
      return;
    }

    try {
      setIsPending(true);

      const prompt_id = await getCreatingBrainPromptId();

      const createdBrainId = await createBrain({
        name,
        description,
        max_tokens: maxTokens,
        model,
        openai_api_key: openAiKey,
        temperature,
        prompt_id,
        type: brainType,
        url: brainUrl,
        top_p: topP,
      });

      if (createdBrainId === undefined) {
        publish({
          variant: "danger",
          text: t("errorCreatingBrain",{ns:"brain"})
        });

        return;
      }

      setActiveBrain({
        id: createdBrainId,
        name,
      });

      if (setDefault) {
        await setAsDefaultBrain(createdBrainId);
      }

      setIsShareModalOpen(false);
      reset(defaultValues);
      publish({
        variant: "success",
        text: t("brainCreated",{ns:"brain"})
      });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        publish({
          variant: "danger",
          text: `${JSON.stringify(
            (
              err.response as {
                data: { detail: string };
              }
            ).data.detail
          )}`,
        });

        return;
      }
      publish({
        variant: "danger",
        text: `${JSON.stringify(err)}`,
      });
    } finally {
      setIsPending(false);
    }
  };

  const pickPublicPrompt = ({
    title,
    content,
  }: {
    title: string;
    content: string;
  }): void => {
    setValue("prompt.title", title, {
      shouldDirty: true,
    });
    setValue("prompt.content", content, {
      shouldDirty: true,
    });
  };

  return {
    isShareModalOpen,
    setIsShareModalOpen,
    handleSubmit,
    register,
    brainType,
    brainUrl,
    openAiKey: openAiKey === "" ? undefined : openAiKey,
    model,
    topP,
    temperature,
    maxTokens,
    isPending,
    pickPublicPrompt,
  };
};
