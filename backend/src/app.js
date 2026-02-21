const uploadbuffer = require("../src/service/storage");
const express = require("express");
const { usermodel, postmodel, campaignmodel, donationmodel } = require("../db/model");
const multer = require("multer");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bcrypt = require('bcryptjs');
require("dotenv").config();

const upload=multer({storage:multer.memoryStorage()})

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

app.use(session({
    secret: 'your-secret-key-change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false
    }
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await usermodel.findOne({ googleId: profile.id });

        if (!user) {
            user = await usermodel.create({
                googleId: profile.id,
                email: profile.emails[0].value,
                name: profile.displayName,
                avatar: profile.photos[0]?.value,
                isNewUser: true
            });
        }

        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await usermodel.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Monthly leaderboard (resets every month)
app.get("/leaderboard/monthly", async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const rankings = await postmodel.aggregate([
            { $match: { userId: { $exists: true, $ne: null }, posted_on: { $gte: startOfMonth } } },
            { $group: { _id: "$userId", totalLikes: { $sum: "$likes" } } },
            { $sort: { totalLikes: -1 } },
            { $limit: 10 },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
            { $project: { _id: 1, totalLikes: 1, "user.name": 1, "user.username": 1, "user.avatar": 1, "user._id": 1 } }
        ]);

        res.json({ success: true, rankings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// All time leaderboard (existing logic, just aliased clearly)
app.get("/leaderboard/alltime", async (req, res) => {
    try {
        const rankings = await postmodel.aggregate([
            { $match: { userId: { $exists: true, $ne: null } } },
            { $group: { _id: "$userId", totalLikes: { $sum: "$likes" } } },
            { $sort: { totalLikes: -1 } },
            { $limit: 10 },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
            { $project: { _id: 1, totalLikes: 1, "user.name": 1, "user.username": 1, "user.avatar": 1, "user._id": 1 } }
        ]);

        res.json({ success: true, rankings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/auth/google', passport.authenticate('google', { 
    scope: ['profile', 'email'] 
}));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: 'http://localhost:5173/acc' }),
    (req, res) => {
        const redirectUrl = req.user.isNewUser 
            ? 'http://localhost:5173/newacc' 
            : 'http://localhost:5173/acc/home';
        res.redirect(redirectUrl);
    }
);

app.get('/auth/user', (req, res) => {
    if (req.isAuthenticated()) {
        res.json({
            success: true,
            user: req.user
        });
    } else {
        res.json({
            success: false,
            message: 'Not authenticated'
        });
    }
});

app.post('/auth/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.json({ success: false, message: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

app.post('/api/upload/avatar', upload.single('file'), async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ 
            success: false, 
            message: 'Not authenticated' 
        });
    }

    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No file uploaded' 
            });
        }

        const result=await uploadbuffer(req.file.buffer)

        res.json({ 
            success: true, 
            avatar: result.url,
            fileId: result.fileId
        });
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            message: error.message 
        });
    }
});


app.put('/api/user/complete-profile', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ 
            success: false, 
            message: 'Not authenticated' 
        });
    }

    try {
        const { username, mobile, name, avatar, password } = req.body;

        const existingUser = await usermodel.findOne({ username });
        if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Username already taken' 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await usermodel.findByIdAndUpdate(
            req.user._id,
            { 
                username, 
                mob: mobile, 
                name,
                avatar,
                password: hashedPassword,
                isNewUser: false 
            },
            { new: true }
        );

        res.json({ success: true, user });
    } catch (error) {
        res.status(400).json({ 
            success: false, 
            message: error.message 
        });
    }
});

app.post("/user/create", async (req, res) => {
    try {
        const { id, name, email, username, password, mob, followers, Following, alltime_rank, monthly_rank, weekly_rank, featured, verified } = req.body;
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await usermodel.create({
            id,
            name,
            email,
            username,
            password: hashedPassword,
            mob,
            followers,
            Following,
            alltime_rank,
            monthly_rank,
            weekly_rank,
            featured,
            verified,
            isNewUser: false
        });
        
        res.status(201).json({
            success: true,
            message: "User created successfully",
            data: newUser
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Error creating user",
            error: error.message
        });
    }
});

app.post("/post/create", upload.fields([{ name: "image", maxCount: 1 }, { name: "video", maxCount: 1 }]), async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    try {
        const { likes, featured } = req.body;

        let imageUrl = null;
        let videoUrl = null;
if (req.files?.image) {
    const imageResult = await uploadbuffer(req.files.image[0].buffer, req.files.image[0].mimetype);
    imageUrl = imageResult.url;
}

if (req.files?.video) {
    const videoResult = await uploadbuffer(req.files.video[0].buffer, req.files.video[0].mimetype);
    videoUrl = videoResult.url;
}

        // Generate unique numeric id for post
        const postCount = await postmodel.countDocuments();

        const newPost = await postmodel.create({
            id: postCount + 1 + Date.now(),
            userId: req.user._id,
            image: imageUrl,
            Video: videoUrl,
            likes: likes || 0,
            featured: featured || false
        });

        res.status(201).json({
            success: true,
            message: "Post created successfully",
            data: newPost
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Error creating post",
            error: error.message
        });
    }
});

app.get("/post/myposts", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    try {
        const posts = await postmodel.find({ userId: req.user._id });
        res.status(200).json({ success: true, posts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});


app.get("/post/view", async (req, res) => {
    try {
        const posts = await postmodel.find()
            .populate('userId', 'name username avatar');
        res.status(200).json({ success: true, posts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put("/post/like/:postId", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    try {
        const post = await postmodel.findById(req.params.postId);
        if (!post) return res.status(404).json({ success: false, message: "Post not found" });

        const userId = req.user._id;
        const alreadyLiked = post.likedBy.includes(userId);

        if (alreadyLiked) {
            // Unlike
            post.likedBy.pull(userId);
            post.likes = Math.max(0, post.likes - 1);
        } else {
            // Like
            post.likedBy.push(userId);
            post.likes += 1;
        }

        await post.save();
        res.json({ success: true, likes: post.likes, liked: !alreadyLiked });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/user/signup", upload.single('avatar'), async (req, res) => {
    try {
        const { name, email, username, password, mob } = req.body;

        // Check if email already exists
        const existingEmail = await usermodel.findOne({ email });
        if (existingEmail) {
            return res.status(400).json({ success: false, message: "Email already registered" });
        }

        // Check if username already exists
        const existingUsername = await usermodel.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ success: false, message: "Username already taken" });
        }

        // Upload avatar if provided
        let avatarUrl = null;
        if (req.file) {
            const result = await uploadbuffer(req.file.buffer);
            avatarUrl = result.url;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await usermodel.create({
            name,
            email,
            username,
            password: hashedPassword,
            mob: mob || null,
            avatar: avatarUrl,
            isNewUser: false
        });

        // Auto login after signup
        req.login(newUser, (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Login after signup failed" });
            }
            res.status(201).json({ success: true, message: "Account created successfully", user: newUser });
        });

    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});
app.post("/user/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Username and password required" });
        }

        const user = await usermodel.findOne({ username });
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid username or password" });
        }

        if (!user.password) {
            return res.status(401).json({ success: false, message: "This account uses Google login" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid username or password" });
        }

        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: "Login failed" });
            }
            res.json({ success: true, user });
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});
// Create campaign
app.post("/campaign/create", upload.single('image'), async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ success: false, message: "Not authenticated" });
    try {
        const { title, description, contributionTypes, peopleNeeded } = req.body;
        let imageUrl = null;
        if (req.file) {
            const result = await uploadbuffer(req.file.buffer);
            imageUrl = result.url;
        }
        const campaign = await campaignmodel.create({
            userId: req.user._id,
            title,
            description,
            image: imageUrl,
            contributionTypes: JSON.parse(contributionTypes || '[]'),
            peopleNeeded: peopleNeeded || 0
        });
        res.status(201).json({ success: true, campaign });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Get all campaigns
app.get("/campaign/all", async (req, res) => {
    try {
        const campaigns = await campaignmodel.find()
            .populate('userId', 'name username avatar')
            .populate('members', 'name avatar')
            .sort({ created_on: -1 });
        res.json({ success: true, campaigns });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update campaign (progress, description etc.)
app.put("/campaign/update/:id", upload.single('image'), async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ success: false, message: "Not authenticated" });
    try {
        const campaign = await campaignmodel.findById(req.params.id);
        if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
        if (campaign.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }
        const { title, description, contributionTypes, peopleNeeded, progress } = req.body;
        let imageUrl = campaign.image;
        if (req.file) {
            const result = await uploadbuffer(req.file.buffer);
            imageUrl = result.url;
        }
        const updatedCampaign = await campaignmodel.findByIdAndUpdate(
            req.params.id,
            {
                title: title || campaign.title,
                description: description || campaign.description,
                image: imageUrl,
                contributionTypes: contributionTypes ? JSON.parse(contributionTypes) : campaign.contributionTypes,
                peopleNeeded: peopleNeeded || campaign.peopleNeeded,
                progress: progress !== undefined ? Number(progress) : campaign.progress,
                status: Number(progress) >= 100 ? 'completed' : 'active'
            },
            { new: true }
        );
        res.json({ success: true, campaign: updatedCampaign });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

// Join request
app.post("/campaign/join/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ success: false, message: "Not authenticated" });
    try {
        const campaign = await campaignmodel.findById(req.params.id);
        if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
        if (campaign.status === 'completed') {
            return res.status(400).json({ success: false, message: "Campaign is completed, no more joins" });
        }
        const alreadyRequested = campaign.joinRequests.some(
            r => r.userId.toString() === req.user._id.toString()
        );
        if (alreadyRequested) {
            return res.status(400).json({ success: false, message: "Already requested" });
        }
        campaign.joinRequests.push({ userId: req.user._id });
        await campaign.save();
        res.json({ success: true, message: "Join request sent!" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Donate to campaign (update amount after Razorpay success)
// Donate to campaign — 94% to campaign, 6% to pool
app.put("/campaign/donate/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ success: false, message: "Not authenticated" });
    try {
        const { amount } = req.body;

        const poolCut = Math.round(amount * 0.06);
        const campaignAmount = amount - poolCut;

        const campaign = await campaignmodel.findByIdAndUpdate(
            req.params.id,
            { $inc: { amountRaised: campaignAmount } },
            { new: true }
        );

        if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

        // Record 94% as campaign donation
        await donationmodel.create({
            userId: req.user._id,
            campaignId: req.params.id,
            type: "donation",
            amount: campaignAmount,
            description: `₹${campaignAmount} donated to "${campaign.title}" by @${req.user.username}`
        });

        // Record 6% as pool donation (no campaignId = goes to pool)
        await donationmodel.create({
            userId: req.user._id,
            type: "donation",
            amount: poolCut,
            description: `₹${poolCut} platform fee (6%) from @${req.user.username}'s donation to "${campaign.title}"`
        });

        // Notify campaign creator
        await usermodel.findByIdAndUpdate(campaign.userId, {
            $push: {
                notifications: {
                    message: `💰 @${req.user.username} donated ₹${campaignAmount} to your campaign "${campaign.title}"!`
                }
            }
        });

        res.json({
            success: true,
            amountRaised: campaign.amountRaised,
            campaignAmount,
            poolCut,
            message: `₹${campaignAmount} to campaign, ₹${poolCut} to platform pool`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get join requests for a campaign
app.get("/campaign/requests/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ success: false });
    try {
        const campaign = await campaignmodel.findById(req.params.id)
            .populate('joinRequests.userId', 'name username avatar');
        if (campaign.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }
        res.json({ success: true, requests: campaign.joinRequests });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Accept or reject join request
app.put("/campaign/request/:campaignId/:userId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ success: false });
    try {
        const { action } = req.body; // 'accepted' or 'rejected'
        const campaign = await campaignmodel.findById(req.params.campaignId);

        if (campaign.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        const request = campaign.joinRequests.find(
            r => r.userId.toString() === req.params.userId
        );
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });

        request.status = action;

        if (action === 'accepted') {
            // Add to members if not already there
            if (!campaign.members.includes(req.params.userId)) {
                campaign.members.push(req.params.userId);
            }
        }

        await campaign.save();

        // Send notification to the user
        const notificationMsg = action === 'accepted'
            ? `✅ Your request to join "${campaign.title}" was accepted!`
            : `❌ Your request to join "${campaign.title}" was rejected.`;

        await usermodel.findByIdAndUpdate(req.params.userId, {
            $push: { notifications: { message: notificationMsg } }
        });

        res.json({ success: true, message: `Request ${action}`, members: campaign.members.length });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get notifications for logged in user
app.get("/user/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ success: false });
    try {
        const user = await usermodel.findById(req.user._id).select('notifications');
        res.json({ success: true, notifications: user.notifications.reverse() });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Mark notifications as read
app.put("/user/notifications/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ success: false });
    try {
        await usermodel.updateOne(
            { _id: req.user._id },
            { $set: { "notifications.$[].read": true } }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get("/leaderboard", async (req, res) => {
    try {
        const rankings = await postmodel.aggregate([
            { $match: { userId: { $exists: true, $ne: null } } },
            { $group: { _id: "$userId", totalLikes: { $sum: "$likes" } } },
            { $sort: { totalLikes: -1 } },  // highest likes first
            { $limit: 10 },                  // top 10
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user"
                }
            },
            { $unwind: "$user" },
            {
                $project: {
                    _id: 1,
                    totalLikes: 1,
                    "user.name": 1,
                    "user.username": 1,
                    "user.avatar": 1,
                    "user._id": 1
                }
            }
        ]);

        res.json({ success: true, rankings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post("/ai/chat", async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    try {
        const { message } = req.body;

        // Fetch all data from DB
        const users = await usermodel.find({}, 'name username avatar followers Following alltime_rank monthly_rank weekly_rank featured verified create_on');
        const posts = await postmodel.find({}, 'userId description likes featured posted_on').populate('userId', 'name username');
        const campaigns = await campaignmodel.find({}, 'userId title description progress status peopleNeeded amountRaised contributionTypes created_on members').populate('userId', 'name username');
        const leaderboard = await postmodel.aggregate([
            { $match: { userId: { $exists: true, $ne: null } } },
            { $group: { _id: "$userId", totalLikes: { $sum: "$likes" } } },
            { $sort: { totalLikes: -1 } },
            { $limit: 10 },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
            { $unwind: "$user" },
            { $project: { totalLikes: 1, "user.name": 1, "user.username": 1 } }
        ]);

        // Keep context small - no image/video URLs
        const dbContext = JSON.stringify({ users, posts, campaigns, leaderboard });
        console.log("DB context size:", dbContext.length, "chars");

        const systemPrompt = `You are a helpful assistant for an eco-action social app. 
Users post their eco-friendly actions (planting trees, cleaning beaches etc), join campaigns, and earn likes.
Here is the current live database data:
${dbContext}
Answer user questions based on this data. Be helpful, friendly and concise.
Do not reveal any sensitive information like passwords or emails.`;

        // Try API 1 — Claude
        try {
            const response = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": process.env.ClaudeAPI,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: "claude-haiku-4-5-20251001",
                    max_tokens: 1024,
                    system: systemPrompt,
                    messages: [{ role: "user", content: message }]
                })
            });

            const data = await response.json();
            console.log("Claude response:", JSON.stringify(data).slice(0, 200));

            if (data.error) throw new Error("Claude error: " + data.error.message);

            return res.json({ success: true, reply: data.content[0].text, usedApi: "claude" });

        } catch (claudeError) {
            console.log("Claude failed:", claudeError.message);

            // Try API 2 — ChatGPT
            try {
                const response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${process.env.openaiAPI}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        max_tokens: 1024,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: message }
                        ]
                    })
                });

                const data = await response.json();
                console.log("OpenAI response:", JSON.stringify(data).slice(0, 200));

                if (data.error) throw new Error("OpenAI error: " + data.error.message);

                return res.json({ success: true, reply: data.choices[0].message.content, usedApi: "chatgpt" });

            } catch (openaiError) {
                console.log("ChatGPT failed:", openaiError.message);

                // Try API 3 — Gemini
                try {
                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GeminiAPI}`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                system_instruction: { parts: [{ text: systemPrompt }] },
                                contents: [{ parts: [{ text: message }] }]
                            })
                        }
                    );

                    const data = await response.json();
                    console.log("Gemini response:", JSON.stringify(data).slice(0, 200));

                    if (data.error) throw new Error("Gemini error: " + data.error.message);

                    return res.json({ success: true, reply: data.candidates[0].content.parts[0].text, usedApi: "gemini" });

                } catch (geminiError) {
    console.log("Gemini failed:", geminiError.message);

    // Try API 4 — Groq (free)
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.GrokAPI}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                max_tokens: 1024,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json();
        console.log("Groq response:", JSON.stringify(data).slice(0, 200));

        if (data.error) throw new Error("Groq error: " + data.error.message);

        return res.json({ success: true, reply: data.choices[0].message.content, usedApi: "groq" });

    } catch (groqError) {
        console.log("Groq failed:", groqError.message);
        throw new Error("All APIs failed. Last: " + groqError.message);
    }
}
            }
        }

    } catch (error) {
        console.log("Final error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get("/donation/pool", async (req, res) => {
  try {
    const donations = await donationmodel.aggregate([
      { $match: { type: "donation" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const allocations = await donationmodel.aggregate([
      { $match: { type: { $in: ["allocation", "reward"] } } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalIn = donations[0]?.total || 0;
    const totalOut = allocations[0]?.total || 0;
    res.json({ success: true, totalPool: totalIn - totalOut });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /donation/transactions ─────────────
// Returns all donation/allocation transactions (public feed)
app.get("/donation/transactions", async (req, res) => {
  try {
    const transactions = await donationmodel.find()
      .sort({ createdAt: -1 })
      .populate("userId", "name username avatar")
      .populate("campaignId", "title")
      .limit(50);
    res.json({ success: true, transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /donation/verify ──────────────────
// Called after Razorpay payment success — verifies & records donation
app.post("/donation/verify", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ success: false });
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;

    // Verify signature
    const crypto = require("crypto");
    const expectedSig = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    // Record donation transaction
    await donationmodel.create({
      userId: req.user._id,
      type: "donation",
      amount,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      description: `Donation by @${req.user.username}`
    });

    res.json({ success: true, message: "Donation recorded!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /donation/allocate ────────────────
// ADMIN ONLY: Allocate pool money to a platform campaign
app.post("/donation/allocate", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ success: false });
  // Add your admin check here, e.g.: if (!req.user.isAdmin) return res.status(403)...
  try {
    const { campaignId, amount } = req.body;
    const campaign = await campaignmodel.findById(campaignId);
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

    // Add amount to campaign
    await campaignmodel.findByIdAndUpdate(campaignId, { $inc: { amountRaised: amount } });

    // Record allocation transaction
    await donationmodel.create({
      userId: req.user._id,
      campaignId,
      type: "allocation",
      amount,
      description: `₹${amount} allocated to campaign "${campaign.title}"`
    });

    res.json({ success: true, message: `₹${amount} allocated to "${campaign.title}"` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /donation/reward-leaderboard ──────
// ADMIN ONLY: Reward a top leaderboard user (funds go to their campaign)
app.post("/donation/reward-leaderboard", async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ success: false });
  // Add admin check here
  try {
    const { userId, amount } = req.body;
    const user = await usermodel.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Record reward transaction
    await donationmodel.create({
      userId: req.user._id,       // admin who sent
      recipientId: userId,         // leaderboard winner
      type: "reward",
      amount,
      description: `Leaderboard reward of ₹${amount} to @${user.username}`
    });

    // Notify user
    await usermodel.findByIdAndUpdate(userId, {
      $push: { notifications: { message: `🏆 You received a ₹${amount} leaderboard reward!` } }
    });

    res.json({ success: true, message: `₹${amount} reward sent to @${user.username}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Submit feedback for a completed campaign
app.post("/campaign/feedback/:campaignId", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ success: false });
    try {
        const { rating, comment } = req.body;
        const campaign = await campaignmodel.findById(req.params.campaignId);
        if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });
        if (campaign.status !== 'completed') return res.status(400).json({ success: false, message: "Campaign not completed yet" });

        const alreadyGiven = campaign.feedbacks?.some(
            f => f.userId.toString() === req.user._id.toString()
        );
        if (alreadyGiven) return res.status(400).json({ success: false, message: "Already submitted feedback" });

        campaign.feedbacks = campaign.feedbacks || [];
        campaign.feedbacks.push({ userId: req.user._id, rating, comment });
        await campaign.save();

        // Recalculate trust score for campaign creator
        const creatorCampaigns = await campaignmodel.find({
            userId: campaign.userId,
            status: 'completed',
            'feedbacks.0': { $exists: true }
        });

        let totalRating = 0;
        let totalCount = 0;
        creatorCampaigns.forEach(c => {
            c.feedbacks.forEach(f => {
                totalRating += f.rating;
                totalCount++;
            });
        });

        const trustScore = totalCount > 0 ? Math.round((totalRating / (totalCount * 5)) * 100) : 0;
        await usermodel.findByIdAndUpdate(campaign.userId, { trustScore });

        res.json({ success: true, message: "Feedback submitted!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get feedbacks for a campaign
app.get("/campaign/feedback/:campaignId", async (req, res) => {
    try {
        const campaign = await campaignmodel.findById(req.params.campaignId)
            .populate('feedbacks.userId', 'name username avatar');
        if (!campaign) return res.status(404).json({ success: false });
        res.json({ success: true, feedbacks: campaign.feedbacks || [] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get trust score for a user
app.get("/user/trustscore/:userId", async (req, res) => {
    try {
        const user = await usermodel.findById(req.params.userId).select('trustScore');
        res.json({ success: true, trustScore: user?.trustScore || 0 });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get("/admin/users", async (req, res) => {
    try {
        const users = await usermodel.find({}, 'name username email avatar trustScore followers Following create_on');
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Admin allocate: verifies Razorpay payment, records allocation, updates campaign fund
app.post("/donation/admin-allocate", async (req, res) => {
    try {
        const { campaignId, amount, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        // Verify Razorpay signature
        const crypto = require("crypto");
        const expectedSig = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSig !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Invalid payment signature" });
        }

        const campaign = await campaignmodel.findById(campaignId);
        if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

        // Check pool has enough balance
        const donations = await donationmodel.aggregate([
            { $match: { type: "donation" } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const allocations = await donationmodel.aggregate([
            { $match: { type: { $in: ["allocation", "reward"] } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const poolBalance = (donations[0]?.total || 0) - (allocations[0]?.total || 0);

        if (amount > poolBalance) {
            return res.status(400).json({ success: false, message: "Insufficient pool balance" });
        }

        // Update campaign's amountRaised
        await campaignmodel.findByIdAndUpdate(campaignId, { $inc: { amountRaised: amount } });

        // Record allocation transaction (this reduces the pool)
        await donationmodel.create({
            type: "allocation",
            campaignId,
            amount,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            description: `Admin allocated ₹${amount} to campaign "${campaign.title}"`
        });

        // Notify campaign creator
        await usermodel.findByIdAndUpdate(campaign.userId, {
            $push: {
                notifications: {
                    message: `🎉 Admin sent ₹${amount} to your campaign "${campaign.title}"!`
                }
            }
        });

        res.json({ success: true, message: `₹${amount} allocated to "${campaign.title}"` });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

const paymentRoutes = require("./routes/payment");

app.use("/payment", paymentRoutes);

module.exports = app;