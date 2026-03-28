import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Char "mo:core/Char";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Blob "mo:core/Blob";
import Random "mo:core/Random";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import InviteLinksModule "invite-links/invite-links-module";

actor {
  // Components
  include MixinStorage();

  module User {
    public func compare(user1 : User, user2 : User) : Order.Order {
      user1.id.compare(user2.id);
    };
    public func compareByName(user1 : User, user2 : User) : Order.Order {
      Text.compare(user1.name, user2.name);
    };
    public func compareByRole(user1 : User, user2 : User) : Order.Order {
      switch (user1.role, user2.role) {
        case (#user1, #user1) { #equal };
        case (#user1, #user2) { #less };
        case (#user2, #user1) { #greater };
        case (#user2, #user2) { #equal };
      };
    };
  };

  type UserRole = {
    #user1;
    #user2;
  };

  type RelationshipStats = {
    startDate : Text;
  };

  type MoodTag = {
    #happy;
    #sad;
    #angry;
    #missYou;
  };

  type Message = {
    id : Text;
    senderId : Principal;
    text : Text;
    moodTag : ?MoodTag;
    createdAt : Int;
    seenBy : [Principal];
  };

  type Card = {
    id : Text;
    senderId : Principal;
    message : Text;
    imageUrl : ?Text;
    createdAt : Int;
    isRead : Bool;
  };

  type Memory = {
    id : Text;
    addedBy : Principal;
    title : Text;
    note : Text;
    imageUrl : ?Text;
    createdAt : Int;
  };

  type MoodType = {
    #happy;
    #sad;
    #anxious;
    #loved;
    #tired;
    #romantic;
  };

  type MoodEntry = {
    id : Text;
    userId : Principal;
    mood : MoodType;
    date : Text;
    note : ?Text;
    createdAt : Int;
  };

  type PeriodLog = {
    id : Text;
    ownerId : Principal;
    date : Text;
    isPeriodDay : Bool;
    symptoms : [Text];
    mood : MoodType;
    note : ?Text;
    createdAt : Int;
    partnerCanSeeDetails : Bool;
  };

  type PeriodLogSummary = {
    id : Text;
    date : Text;
    isPeriodDay : Bool;
    createdAt : Int;
  };

  type SurpriseDrop = {
    id : Text;
    creatorId : Principal;
    recipientId : Principal;
    message : Text;
    imageUrl : ?Text;
    unlockAt : Int;
    isRevealed : Bool;
    createdAt : Int;
  };

  type Question = {
    id : Text;
    authorId : Principal;
    questionText : Text;
    correctAnswer : Text;
    createdAt : Int;
  };

  type Answer = {
    id : Text;
    questionId : Text;
    answererId : Principal;
    answerText : Text;
    isCorrect : Bool;
    createdAt : Int;
  };

  type User = {
    id : Principal;
    name : Text;
    role : UserRole;
  };

  type CoupleAppState = {
    var users : Map.Map<Principal, User>;
    var messages : Map.Map<Text, Message>;
    var sorryCards : Map.Map<Text, Card>;
    var memories : Map.Map<Text, Memory>;
    var moodEntries : Map.Map<Text, MoodEntry>;
    var periodLogs : Map.Map<Text, PeriodLog>;
    var surpriseDrops : Map.Map<Text, SurpriseDrop>;
    var questions : Map.Map<Text, Question>;
    var answers : Map.Map<Text, Answer>;
    var relationshipStats : ?RelationshipStats;
    var nextIdCounter : Nat;
  };

  func getNextId(state : CoupleAppState) : Text {
    let id = state.nextIdCounter.toText();
    state.nextIdCounter += 1;
    id;
  };

  func initializeCoupleAppState() : CoupleAppState {
    {
      var users = Map.empty<Principal, User>();
      var messages = Map.empty<Text, Message>();
      var sorryCards = Map.empty<Text, Card>();
      var memories = Map.empty<Text, Memory>();
      var moodEntries = Map.empty<Text, MoodEntry>();
      var periodLogs = Map.empty<Text, PeriodLog>();
      var surpriseDrops = Map.empty<Text, SurpriseDrop>();
      var questions = Map.empty<Text, Question>();
      var answers = Map.empty<Text, Answer>();
      var relationshipStats = null;
      var nextIdCounter = 1;
    };
  };

  func compareMemoryByTitle(memory1 : Memory, memory2 : Memory) : Order.Order {
    Text.compare(memory1.title, memory2.title);
  };

  func compareMemoryByDate(memory1 : Memory, memory2 : Memory) : Order.Order {
    Int.compare(memory1.createdAt, memory2.createdAt);
  };

  // Persistent State Variable
  let coupleAppState : CoupleAppState = initializeCoupleAppState();

  // Components
  let accessControlState = AccessControl.initState();
  let inviteState = InviteLinksModule.initState();
  include MixinAuthorization(accessControlState);

  // Helper function to check if user is registered
  func isRegisteredUser(caller : Principal) : Bool {
    coupleAppState.users.containsKey(caller);
  };

  // Helper function to get the partner's principal
  func getPartner(caller : Principal) : ?Principal {
    for ((principal, user) in coupleAppState.users.entries()) {
      if (principal != caller) {
        return ?principal;
      };
    };
    null;
  };

  // User Profile functions required by frontend
  public type UserProfile = {
    name : Text;
    role : UserRole;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      return null;
    };
    switch (coupleAppState.users.get(caller)) {
      case (?user) {
        ?{ name = user.name; role = user.role };
      };
      case (null) { null };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    switch (coupleAppState.users.get(user)) {
      case (?u) {
        ?{ name = u.name; role = u.role };
      };
      case (null) { null };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let user = {
      id = caller;
      name = profile.name;
      role = profile.role;
    };
    coupleAppState.users.add(caller, user);
  };

  // User Setup
  public shared ({ caller }) func createUser(name : Text, role : UserRole) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create user");
    };
    if (coupleAppState.users.containsKey(caller)) {
      Runtime.trap("User already exists");
    };
    let userCount = coupleAppState.users.size();
    if (userCount >= 2) {
      Runtime.trap("Maximum 2 users allowed");
    };
    let user = {
      id = caller;
      name;
      role;
    };
    coupleAppState.users.add(caller, user);
  };

  public shared ({ caller }) func setRelationshipStartDate(date : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set relationship start date");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    switch (coupleAppState.relationshipStats) {
      case (null) {
        coupleAppState.relationshipStats := ?{ startDate = date };
      };
      case (_) { Runtime.trap("Relationship start date already set") };
    };
  };

  // Returns all registered users - no pre-registration required so onboarding can check slot availability
  public query ({ caller }) func getUsers() : async [User] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view users");
    };
    coupleAppState.users.values().toArray().sort();
  };

  // Chat Messages
  public shared ({ caller }) func sendMessage(text : Text, moodTag : ?MoodTag) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    let id = getNextId(coupleAppState);
    let message = {
      id;
      senderId = caller;
      text;
      moodTag;
      createdAt = Time.now();
      seenBy = [caller];
    };
    coupleAppState.messages.add(id, message);
  };

  public shared ({ caller }) func markMessageAsSeen(messageId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark messages as seen");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    switch (coupleAppState.messages.get(messageId)) {
      case (?message) {
        if (message.seenBy.find(func(id) { id == caller }) != null) {
          Runtime.trap("Message already seen");
        };
        let updatedMessage = {
          message with
          seenBy = message.seenBy.concat([caller]);
        };
        coupleAppState.messages.add(messageId, updatedMessage);
      };
      case (null) { Runtime.trap("Message not found") };
    };
  };

  public query ({ caller }) func getMessages() : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view messages");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    coupleAppState.messages.values().toArray();
  };

  // Sorry Cards
  public shared ({ caller }) func sendSorryCard(message : Text, imageUrl : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send sorry cards");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    let id = getNextId(coupleAppState);
    let card = {
      id;
      senderId = caller;
      message;
      imageUrl;
      createdAt = Time.now();
      isRead = false;
    };
    coupleAppState.sorryCards.add(id, card);
  };

  public shared ({ caller }) func markCardAsRead(cardId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark cards as read");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    switch (coupleAppState.sorryCards.get(cardId)) {
      case (?card) {
        if (card.senderId == caller) {
          Runtime.trap("Cannot mark your own card as read");
        };
        if (card.isRead) {
          Runtime.trap("Card already read");
        };
        let updatedCard = { card with isRead = true };
        coupleAppState.sorryCards.add(cardId, updatedCard);
      };
      case (null) { Runtime.trap("Card not found") };
    };
  };

  public query ({ caller }) func getCards() : async [Card] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view cards");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    coupleAppState.sorryCards.values().toArray();
  };

  public query ({ caller }) func getCardsFiltered(messageFilter : Text, senderOnly : Bool) : async [Card] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can filter cards");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };

    let filtered = coupleAppState.sorryCards.filter(
      func(_id, card) {
        var matches = true;
        if (messageFilter != "") {
          matches := matches and card.message.contains(#text messageFilter);
        };
        if (senderOnly) {
          matches := matches and card.senderId == caller;
        };
        matches;
      }
    );
    filtered.values().toArray();
  };

  // Memories
  public shared ({ caller }) func addMemory(title : Text, note : Text, imageUrl : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add memories");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    let id = getNextId(coupleAppState);
    let memory = {
      id;
      addedBy = caller;
      title;
      note;
      imageUrl;
      createdAt = Time.now();
    };
    coupleAppState.memories.add(id, memory);
  };

  public shared ({ caller }) func deleteMemory(memoryId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete memories");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    switch (coupleAppState.memories.get(memoryId)) {
      case (?memory) {
        if (memory.addedBy != caller) {
          Runtime.trap("Unauthorized: Only the creator can delete this memory");
        };
        coupleAppState.memories.remove(memoryId);
      };
      case (null) { Runtime.trap("Memory not found") };
    };
  };

  public query ({ caller }) func getMemories() : async [Memory] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view memories");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    coupleAppState.memories.values().toArray();
  };

  public query ({ caller }) func getMemoriesSortedByTitle() : async [Memory] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view memories");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    coupleAppState.memories.values().toArray().sort(compareMemoryByTitle);
  };

  public query ({ caller }) func getMemoriesSortedByDate() : async [Memory] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view memories");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    coupleAppState.memories.values().toArray().sort(compareMemoryByDate);
  };

  // Mood Log
  public shared ({ caller }) func logMood(mood : MoodType, date : Text, note : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can log mood");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    let id = getNextId(coupleAppState);
    let entry = {
      id;
      userId = caller;
      mood;
      date;
      note;
      createdAt = Time.now();
    };
    coupleAppState.moodEntries.add(id, entry);
  };

  public query ({ caller }) func getMoodEntries() : async [MoodEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view mood entries");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    coupleAppState.moodEntries.values().toArray();
  };

  // Period Tracker
  public shared ({ caller }) func addPeriodLog(date : Text, isPeriodDay : Bool, symptoms : [Text], mood : MoodType, note : ?Text, partnerCanSeeDetails : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add period logs");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    let id = getNextId(coupleAppState);
    let log = {
      id;
      ownerId = caller;
      date;
      isPeriodDay;
      symptoms;
      mood;
      note;
      createdAt = Time.now();
      partnerCanSeeDetails;
    };
    coupleAppState.periodLogs.add(id, log);
  };

  public shared ({ caller }) func updatePeriodLog(logId : Text, symptoms : [Text], mood : MoodType, note : ?Text, partnerCanSeeDetails : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update period logs");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    switch (coupleAppState.periodLogs.get(logId)) {
      case (?log) {
        if (log.ownerId != caller) {
          Runtime.trap("Unauthorized: Only the owner can update this period log");
        };
        let updatedLog = {
          log with
          symptoms;
          mood;
          note;
          partnerCanSeeDetails;
        };
        coupleAppState.periodLogs.add(logId, updatedLog);
      };
      case (null) { Runtime.trap("Period log not found") };
    };
  };

  public query ({ caller }) func getPeriodLogs(owner : Principal) : async [PeriodLog] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view period logs");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    let allLogs = coupleAppState.periodLogs.values().toArray();
    let filteredLogs = allLogs.filter(func(log) {
      if (log.ownerId == owner and caller == owner) {
        return true;
      };
      if (log.ownerId == owner and caller != owner and log.partnerCanSeeDetails) {
        return true;
      };
      false;
    });
    if (caller != owner) {
      filteredLogs.map<PeriodLog, PeriodLog>(func(log) {
        if (not log.partnerCanSeeDetails) {
          {
            log with
            symptoms = [];
            note = null;
          };
        } else {
          log;
        };
      });
    } else {
      filteredLogs;
    };
  };

  // Surprise Drops
  public shared ({ caller }) func createDrop(recipientId : Principal, message : Text, imageUrl : ?Text, unlockAt : Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create drops");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    if (not isRegisteredUser(recipientId)) {
      Runtime.trap("Recipient not registered");
    };
    if (caller == recipientId) {
      Runtime.trap("Cannot create drop for yourself");
    };
    let id = getNextId(coupleAppState);
    let drop = {
      id;
      creatorId = caller;
      recipientId;
      message;
      imageUrl;
      unlockAt;
      isRevealed = false;
      createdAt = Time.now();
    };
    coupleAppState.surpriseDrops.add(id, drop);
  };

  public shared ({ caller }) func revealDrop(dropId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reveal drops");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    switch (coupleAppState.surpriseDrops.get(dropId)) {
      case (?drop) {
        if (drop.recipientId != caller) {
          Runtime.trap("Only the recipient can reveal this drop");
        };
        if (drop.isRevealed) {
          Runtime.trap("Drop already revealed");
        };
        if (Time.now() < drop.unlockAt) {
          Runtime.trap("Drop is still locked");
        };
        let updatedDrop = { drop with isRevealed = true };
        coupleAppState.surpriseDrops.add(dropId, updatedDrop);
      };
      case (null) { Runtime.trap("Drop not found") };
    };
  };

  public query ({ caller }) func getDropsForUser() : async [SurpriseDrop] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view drops");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    let allDrops = coupleAppState.surpriseDrops.values().toArray();
    allDrops.filter<SurpriseDrop>(func(drop) {
      drop.recipientId == caller;
    });
  };

  // Quiz Questions
  public shared ({ caller }) func addQuestion(questionText : Text, correctAnswer : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add questions");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    let id = getNextId(coupleAppState);
    let question = {
      id;
      authorId = caller;
      questionText;
      correctAnswer;
      createdAt = Time.now();
    };
    coupleAppState.questions.add(id, question);
  };

  public shared ({ caller }) func submitAnswer(questionId : Text, answerText : Text) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit answers");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };

    switch (coupleAppState.questions.get(questionId)) {
      case (?question) {
        if (question.authorId == caller) {
          Runtime.trap("Cannot answer your own question");
        };
        let isCorrect = Text.equal(answerText, question.correctAnswer);
        let id = getNextId(coupleAppState);
        let answer = {
          id;
          questionId;
          answererId = caller;
          answerText;
          isCorrect;
          createdAt = Time.now();
        };
        coupleAppState.answers.add(id, answer);
        isCorrect;
      };
      case (null) { Runtime.trap("Question not found") };
    };
  };

  public query ({ caller }) func getQuestions() : async [Question] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view questions");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    let allQuestions = coupleAppState.questions.values().toArray();
    allQuestions.filter<Question>(func(question) {
      question.authorId != caller;
    });
  };

  public query ({ caller }) func getAnswers() : async [Answer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view answers");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    coupleAppState.answers.values().toArray();
  };

  // Relationship Stats
  public query ({ caller }) func getRelationshipStats() : async ?RelationshipStats {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view relationship stats");
    };
    if (not isRegisteredUser(caller)) {
      Runtime.trap("User not registered");
    };
    coupleAppState.relationshipStats;
  };

  // Invite code generation - accessible to any authenticated user for onboarding
  public shared ({ caller }) func generateInviteCode() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate invite codes");
    };
    let blob = await Random.blob();
    let code = InviteLinksModule.generateUUID(blob);
    InviteLinksModule.generateInviteCode(inviteState, code);
    code;
  };

  public shared func submitRSVP(name : Text, attending : Bool, inviteCode : Text) : async () {
    InviteLinksModule.submitRSVP(inviteState, name, attending, inviteCode);
  };

  public query ({ caller }) func getAllRSVPs() : async [InviteLinksModule.RSVP] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can view RSVPs");
    };
    InviteLinksModule.getAllRSVPs(inviteState);
  };

  public query ({ caller }) func getInviteCodes() : async [InviteLinksModule.InviteCode] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admin can view invite codes");
    };
    InviteLinksModule.getInviteCodes(inviteState);
  };
};
