import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import dbConnect from "@/lib/dbConnection";
import UserModel from "@/model/User";
import { User } from "next-auth";
import { acceptMessageSchema } from "@/schemas/acceptMessageSchema";

export async function POST(request: Request) {
    // Connect to the database
    await dbConnect();

    const session = await getServerSession(authOptions);
    const user: User = session?.user;
    if (!session || !session.user) {
        return Response.json(
            { success: false, message: 'Not authenticated' },
            { status: 401 }
        );
    }
    const userId = user._id;
    try {
        const requestData = await request.json();
        // Validate the data using zod schema
        const validationResult = acceptMessageSchema.safeParse(requestData);
        if (!validationResult.success) {
            const errors = validationResult.error.errors.map(error => error.message);
            return Response.json(
                { success: false, message: errors.join(', ') },
                { status: 400 }
            )
        }
        const { acceptMessages } = validationResult.data;
        // Update the user's message acceptance status
        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { isAcceptingMessages: acceptMessages },
            { new: true }
        );

        if (!updatedUser) {
            // User not found
            return Response.json(
                {
                    success: false,
                    message: 'Unable to find user to update message acceptance status',
                },
                { status: 404 }
            );
        }

        // Successfully updated message acceptance status
        return Response.json(
            {
                success: true,
                message: 'Message acceptance status updated successfully',
                updatedUser,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error updating message acceptance status:', error);
        return Response.json(
            { success: false, message: 'Error updating message acceptance status' },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    // Connect to the database
    await dbConnect();

    const session = await getServerSession(authOptions);
    const user = session?.user;

    // Check if the user is authenticated
    if (!session || !user) {
        return Response.json(
            { success: false, message: 'Not authenticated' },
            { status: 401 }
        );
    }
    try {
        const foundUser = await UserModel.findById(user._id);

        if (!foundUser) {
            // User not found
            return Response.json(
                { success: false, message: 'User not found' },
                { status: 404 }
            );
        }

        // Return the user's message acceptance status
        return Response.json(
            {
                success: true,
                isAcceptingMessages: foundUser.isAcceptingMessage,
            },
            { status: 200 }
        );
    } catch (err) {
        console.error('Error retrieving message acceptance status:', err);
        return Response.json(
            { success: false, message: 'Error retrieving message acceptance status' },
            { status: 500 }
        );
    }
}
