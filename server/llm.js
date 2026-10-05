import Anthropic from '@anthropic-ai/sdk';
import { config } from './config.js';

export class LlmError extends Error {}

let client;
const getClient = () => (client ??= new Anthropic({ timeout: 25 * 60_000, maxRetries: 3 }));

const canThink = (model) => !/haiku/i.test(model);

function textOf(message) {
  if (message.stop_reason === 'refusal') {
    throw new LlmError('Mô hình từ chối xử lý nội dung này. Vui lòng kiểm tra lại tệp tải lên.');
  }
  if (message.stop_reason === 'max_tokens') {
    throw new LlmError('Kết quả bị cắt do quá dài. Hãy thử tải ít tệp hơn hoặc tách công trình thành từng phần.');
  }
  return message.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
}

async function stream(params) {
  try {
    return await getClient().messages.stream(params).finalMessage();
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError || /authentication method/i.test(e.message)) throw new LlmError('Khóa API không hợp lệ hoặc chưa được cấu hình (ANTHROPIC_API_KEY).');
    if (e instanceof Anthropic.RateLimitError) throw new LlmError('Dịch vụ AI đang quá tải hoặc vượt hạn mức. Vui lòng thử lại sau ít phút.');
    if (e instanceof Anthropic.BadRequestError) throw new LlmError(`Yêu cầu không hợp lệ: ${e.message}`);
    if (e instanceof Anthropic.APIConnectionError) throw new LlmError('Không kết nối được tới dịch vụ AI. Vui lòng kiểm tra mạng và thử lại.');
    throw new LlmError(`Lỗi từ dịch vụ AI: ${e.message}`);
  }
}

/** Gọi mô hình và nhận JSON đúng schema (structured outputs). */
export async function callJson({ system, user, schema, maxTokens = config.maxOutputTokens, effort = config.effort }) {
  const msg = await stream({
    model: config.model,
    max_tokens: maxTokens,
    system,
    ...(canThink(config.model) ? { thinking: { type: 'adaptive' } } : {}),
    output_config: { effort, format: { type: 'json_schema', schema } },
    messages: [{ role: 'user', content: user }],
  });
  const raw = textOf(msg);
  try {
    return JSON.parse(raw);
  } catch {
    throw new LlmError('Mô hình trả về dữ liệu không đúng định dạng. Vui lòng thử lại.');
  }
}

/** Gọi mô hình lấy văn bản tự do (dùng cho ghi chú đọc từng phần). */
export async function callText({ system, user, maxTokens = Math.min(64000, config.maxOutputTokens), effort = 'medium' }) {
  const msg = await stream({
    model: config.model,
    max_tokens: maxTokens,
    ...(system ? { system } : {}),
    ...(canThink(config.model) ? { thinking: { type: 'adaptive' } } : {}),
    output_config: { effort },
    messages: [{ role: 'user', content: user }],
  });
  return textOf(msg);
}
