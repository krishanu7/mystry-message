import { z } from "zod";
import { usernameValidation } from "./signUpSchema";
import { messageSchema } from "./messageSchema";

export const sendMessageSchema = z.object({
    username: usernameValidation,
    content: messageSchema.shape.content,
});