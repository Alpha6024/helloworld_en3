const mongoose = require("mongoose");

const Userschema = new mongoose.Schema({
    googleId: { type: String, unique: true, sparse: true },
    id: { type: Number, unique: true, sparse: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    username: { type: String, unique: true, sparse: true, trim: true, minlength: 3, maxlength: 30, match: /^[a-zA-Z0-9_]+$/ },
    password: { type: String, minlength: 6 },
    avatar: { type: String },
    mob: {
        type: Number,
        validate: {
            validator: function(v) { return v ? /^\d{10}$/.test(v.toString()) : true; },
            message: 'Mobile number must be 10 digits'
        }
    },
    followers: { type: Number, default: 0, min: 0 },
    Following: { type: Number, default: 0, min: 0 },
    alltime_rank: { type: Number, default: 0, min: 0 },
    monthly_rank: { type: Number, default: 0, min: 0 },
    weekly_rank: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    isNewUser: { type: Boolean, default: true },
    trustScore: { type: Number, default: 0 },
    create_on: { type: Date, default: Date.now },
    notifications: [{
        message: { type: String },
        read: { type: Boolean, default: false },
        created_on: { type: Date, default: Date.now }
    }]
});

const Postschema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    description: { type: String, trim: true, maxlength: 500 },
    image: { type: String, trim: true },
    Video: { type: String, trim: true },
    likes: { type: Number, default: 0, min: 0 },
    featured: { type: Boolean, default: false },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    posted_on: { type: Date, default: Date.now },
    updated_on: { type: Date, default: Date.now }
});

const Campaignschema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1000 },
    image: { type: String },
    contributionTypes: [{ type: String, trim: true }],
    peopleNeeded: { type: Number, default: 0 },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    amountRaised: { type: Number, default: 0 },
    joinRequests: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
    }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    feedbacks: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, trim: true },
        created_on: { type: Date, default: Date.now }
    }],
    created_on: { type: Date, default: Date.now }
});

const donationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "campaign" },
    type: { type: String, enum: ["donation", "allocation", "reward"], required: true },
    amount: { type: Number, required: true },
    paymentId: { type: String },
    orderId: { type: String },
    description: { type: String },
}, { timestamps: true });

const donationmodel = mongoose.model("donation", donationSchema);
const campaignmodel = mongoose.model("campaign", Campaignschema);
const usermodel = mongoose.model("user", Userschema);
const postmodel = mongoose.model("post", Postschema);

module.exports = { usermodel, postmodel, campaignmodel, donationmodel };