import { answerCollection, db, questionCollection, voteCollection } from "@/models/name";
import { databases, users } from "@/models/server/config";
import { UserPrefs } from "@/store/Auth";
import { Query } from "appwrite";
import { NextRequest, NextResponse } from "next/server";
import { ID } from "node-appwrite";



export async function POST(request: NextRequest) {
    try {
        // grab the data
        const { votedById, voteStatus, type, typeId } = await request.json()
        //list-document
        const response = await databases.listDocuments(
            db, voteCollection, [
            Query.equal("type", type),
            Query.equal("typeId", typeId),
            Query.equal("votedById", votedById),
        ])
        if (response.documents.length > 0) {
            await databases.deleteDocument(db, voteCollection, response.documents[0].$id)
            // Decrease the reputation of the question/answer author
            const QuestionAnswer = await databases.getDocument(
                db,
                type == "question" ? questionCollection : answerCollection,
                typeId
            );
            const authorPrefs = await users.getPrefs<UserPrefs>(QuestionAnswer.authorId)
            await users.updatePrefs<UserPrefs>(QuestionAnswer.authorId, {
                reputation: response.documents[0].voteStatus === "upvoted" ?
                    Number(authorPrefs.reputation) - 1 : Number(authorPrefs.reputation) + 1
            })
        }
        // that means prev vote does not exists or voteStatus changed
        if (response.documents[0]?.voteStatus !== voteStatus) {
            const doc = await databases.createDocument(db, voteCollection, ID.unique(), {
                type,
                typeId,
                voteStatus,
                votedById
            });
            // Increate/Decrease the reputation of the question/answer author accordingly
            const QuestionAnswer = await databases.getDocument(
                db,
                type == "question" ? questionCollection : answerCollection,
                typeId
            );
            const authorPrefs = await users.getPrefs<UserPrefs>(QuestionAnswer.authorId)
            //if vote present
            if (response.documents[0]) {
                await users.updatePrefs<UserPrefs>
                    (QuestionAnswer.authorId, {
                        reputation:
                            // that means prev vote was "upvoted" and new value is "downvoted" so we have to decrease the reputation
                            response.documents[0].voteStatus === "upvoted"
                                ? Number(authorPrefs.reputation) - 1 : Number(authorPrefs.reputation) + 1,
                    });
            } else {
                await users.updatePrefs<UserPrefs>
                    (QuestionAnswer.authorId, {
                        reputation:
                            // that means prev vote was "upvoted" and new value is "downvoted" so we have to decrease the reputation
                            voteStatus === "upvoted"
                                ? Number(authorPrefs.reputation) + 1 : Number(authorPrefs.reputation) - 1,
                    });
            }
            const [upvotes, downvotes] = await Promise.all([
                databases.listDocuments(db, voteCollection, [
                    Query.equal("type", type),
                    Query.equal("typeId", typeId),
                    Query.equal("voteStatus", "upvoted"),
                    Query.equal("votedById", votedById),
                    Query.limit(1),
                ]),
                databases.listDocuments(db, voteCollection, [
                    Query.equal("type", type),
                    Query.equal("typeId", typeId),
                    Query.equal("voteStatus", "downvoted"),
                    Query.equal("votedById", votedById),
                    Query.limit(1),
                ]),
            ])

            return NextResponse.json(
                {
                    data: {
                        document: doc, voteResult: upvotes.total - downvotes.total
                    },
                    message: response.documents[0] ? "Vote Status Updated" : "voted"
                },
                {
                    status: 201
                }
            )
        }

        // const [upvotes, downvotes] = await Promise.all([
        //     databases.listDocuments(db, voteCollection, [
        //         Query.equal("type", type),
        //         Query.equal("typeId", typeId),
        //         Query.equal("voteStatus", "upvoted"),
        //         Query.equal("votedById", votedById),
        //         Query.limit(1),
        //     ]),
        //     databases.listDocuments(db, voteCollection, [
        //         Query.equal("type", type),
        //         Query.equal("typeId", typeId),
        //         Query.equal("voteStatus", "downvoted"),
        //         Query.equal("votedById", votedById),
        //         Query.limit(1),
        //     ]),
        // ])

        // return NextResponse.json(
        //     {
        //         data: {
        //             document: null, voteResult: upvotes.total - downvotes.total
        //         },
        //         message: "vote handled"
        //     },
        //     {
        //         status: 200
        //     }
        // )

    } catch (error: any) {
        return NextResponse.json(
            { message: error?.message || "Error in voting" },
            { status: error?.status || error?.code || 500 }
        );
    }
}