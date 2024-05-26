import UserMOdel from '@/model/User';
import dbConnect from '@/lib/dbConnection';
import { Message } from '@/model/User';
import { sendMessageSchema } from '@/schemas/sendMessageSchema';

export async function POST(request: Request) {
    await dbConnect();

    try {
        const requestData = await request.json();
        const validationRes = sendMessageSchema.safeParse(requestData);

        if (!validationRes.success) {
            const errors = validationRes.error.errors.map(error => error.message);
            return Response.json(
                { success: false, message: errors.join(', ') },
                { status: 400 }
            )
        }
        const { username, content } = validationRes.data;

        const user = await UserMOdel.findOne({ username }).exec();
        if (!user) {
            return Response.json(
                { message: 'User not found', success: false },
                { status: 404 }
            );
        }
        if (!user.isAcceptingMessage) {
            return Response.json(
                { message: 'User is not accepting messages', success: false },
                { status: 403 }
            );
        }
        const newMessage = { content, createdAt: new Date() };
        user.messages.push(newMessage as Message);
        await user.save();

        return Response.json(
            { message: 'Message sent successfully', success: true },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error adding message:', error);
        return Response.json(
            { message: 'Internal server error', success: false },
            { status: 500 }
        );
    }
}