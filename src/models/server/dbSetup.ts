import { db } from "../name";
import createAnswerCollection from "./answer.collection";
import createQuestionCollection from "./question.collection";
import createCommentCollection from "./comment.collection";
import createVoteCollection from "./vote.collection";
import { databases } from "./config";

export default async function getOrCreateDB() {
    try {
        await databases.get(db)
        console.log("Database connection");
    } catch (error) {
        try {
            await databases.create(db, db)
            console.log("databae created");
            //create collections
            await Promise.all([
                createAnswerCollection(),
                createQuestionCollection(),
                createCommentCollection(),
                createVoteCollection(),
            ])
            console.log("Collection Created");
            console.log("Database connected");
        } catch (error) {
            console.log("Error creating databases or collection", error);
        }
    }
    return databases
}