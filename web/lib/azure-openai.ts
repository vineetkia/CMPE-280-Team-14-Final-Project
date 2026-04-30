// Azure AI Foundry — Azure OpenAI v1 API client.
//
// The Azure v1 surface (`/openai/v1/`) is key-compatible with the OpenAI SDK
// when the SDK is pointed at the Azure baseURL. We DO NOT use AzureOpenAI()
// from the openai package because that targets the legacy `/openai/deployments/{name}/`
// surface and requires an api-version. The new v1 GA surface is simpler.
//
// At call time, the `model` parameter is the Azure *deployment name*, not the
// OpenAI model ID. See OPENAI_CHAT_MODEL / OPENAI_SURVEY_MODEL in .env.
//
// Reference: https://learn.microsoft.com/azure/foundry/openai/api-version-lifecycle#code-changes
import OpenAI from "openai";

let _client: OpenAI | null = null;

export function azureOpenAI(): OpenAI {
  if (_client) return _client;
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;
  if (!apiKey || !baseURL) {
    throw new Error(
      "Azure OpenAI not configured: set OPENAI_API_KEY and OPENAI_BASE_URL in .env",
    );
  }
  _client = new OpenAI({
    apiKey,
    baseURL,
    // Azure's v1 GA surface accepts the api-key header without an api-version
    // query param. Some Azure resources still require the SDK to send an
    // api-version, which the SDK does by default; pass `defaultQuery` to
    // pin behavior if you hit a "missing api-version" error from a resource
    // configured for preview-only operations:
    //   defaultQuery: { "api-version": "preview" },
  });
  return _client;
}

export const AZURE_CHAT_MODEL =
  process.env.OPENAI_CHAT_MODEL || "truestar-gpt-5.3-chat";
export const AZURE_SURVEY_MODEL =
  process.env.OPENAI_SURVEY_MODEL || "truestar-gpt-5.4-mini";
