import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface Card {
    id: string;
    createdAt: bigint;
    isRead: boolean;
    imageUrl?: string;
    message: string;
    senderId: Principal;
}
export interface User {
    id: Principal;
    name: string;
    role: UserRole;
}
export interface SurpriseDrop {
    id: string;
    createdAt: bigint;
    creatorId: Principal;
    unlockAt: bigint;
    imageUrl?: string;
    message: string;
    recipientId: Principal;
    isRevealed: boolean;
}
export interface RelationshipStats {
    startDate: string;
}
export interface InviteCode {
    created: Time;
    code: string;
    used: boolean;
}
export interface RSVP {
    name: string;
    inviteCode: string;
    timestamp: Time;
    attending: boolean;
}
export interface MoodEntry {
    id: string;
    userId: Principal;
    date: string;
    mood: MoodType;
    note?: string;
    createdAt: bigint;
}
export interface PeriodLog {
    id: string;
    ownerId: Principal;
    date: string;
    mood: MoodType;
    note?: string;
    createdAt: bigint;
    isPeriodDay: boolean;
    partnerCanSeeDetails: boolean;
    symptoms: Array<string>;
}
export interface Memory {
    id: string;
    title: string;
    note: string;
    createdAt: bigint;
    imageUrl?: string;
    addedBy: Principal;
}
export interface Message {
    id: string;
    moodTag?: MoodTag;
    createdAt: bigint;
    text: string;
    seenBy: Array<Principal>;
    senderId: Principal;
}
export interface Answer {
    id: string;
    createdAt: bigint;
    isCorrect: boolean;
    questionId: string;
    answerText: string;
    answererId: Principal;
}
export interface Question {
    id: string;
    authorId: Principal;
    createdAt: bigint;
    correctAnswer: string;
    questionText: string;
}
export interface UserProfile {
    name: string;
    role: UserRole;
}
export enum MoodTag {
    sad = "sad",
    happy = "happy",
    angry = "angry",
    missYou = "missYou"
}
export enum MoodType {
    sad = "sad",
    tired = "tired",
    anxious = "anxious",
    happy = "happy",
    romantic = "romantic",
    loved = "loved"
}
export enum UserRole {
    user1 = "user1",
    user2 = "user2"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addMemory(title: string, note: string, imageUrl: string | null): Promise<void>;
    addPeriodLog(date: string, isPeriodDay: boolean, symptoms: Array<string>, mood: MoodType, note: string | null, partnerCanSeeDetails: boolean): Promise<void>;
    addQuestion(questionText: string, correctAnswer: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    createDrop(recipientId: Principal, message: string, imageUrl: string | null, unlockAt: bigint): Promise<void>;
    createUser(name: string, role: UserRole): Promise<void>;
    deleteMemory(memoryId: string): Promise<void>;
    generateInviteCode(): Promise<string>;
    getAllRSVPs(): Promise<Array<RSVP>>;
    getAnswers(): Promise<Array<Answer>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getCards(): Promise<Array<Card>>;
    getCardsFiltered(messageFilter: string, senderOnly: boolean): Promise<Array<Card>>;
    getDropsForUser(): Promise<Array<SurpriseDrop>>;
    getInviteCodes(): Promise<Array<InviteCode>>;
    getMemories(): Promise<Array<Memory>>;
    getMemoriesSortedByDate(): Promise<Array<Memory>>;
    getMemoriesSortedByTitle(): Promise<Array<Memory>>;
    getMessages(): Promise<Array<Message>>;
    getMoodEntries(): Promise<Array<MoodEntry>>;
    getPeriodLogs(owner: Principal): Promise<Array<PeriodLog>>;
    getQuestions(): Promise<Array<Question>>;
    getRelationshipStats(): Promise<RelationshipStats | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUsers(): Promise<Array<User>>;
    isCallerAdmin(): Promise<boolean>;
    logMood(mood: MoodType, date: string, note: string | null): Promise<void>;
    markCardAsRead(cardId: string): Promise<void>;
    markMessageAsSeen(messageId: string): Promise<void>;
    revealDrop(dropId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendMessage(text: string, moodTag: MoodTag | null): Promise<void>;
    sendSorryCard(message: string, imageUrl: string | null): Promise<void>;
    setRelationshipStartDate(date: string): Promise<void>;
    submitAnswer(questionId: string, answerText: string): Promise<boolean>;
    submitRSVP(name: string, attending: boolean, inviteCode: string): Promise<void>;
    updatePeriodLog(logId: string, symptoms: Array<string>, mood: MoodType, note: string | null, partnerCanSeeDetails: boolean): Promise<void>;
}
