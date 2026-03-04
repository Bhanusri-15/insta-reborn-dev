

# "Network" — Instagram-Inspired Social Media App

## Overview
A full-featured social media platform built with React, Lovable Cloud (Supabase), and Cloudinary for media storage. Instagram-inspired modern UI with its own "Network" brand identity.

---

## Phase 1: Foundation & Authentication
- **Lovable Cloud setup** — database, auth, storage
- **Email/password signup & login** with form validation
- **Google OAuth** sign-in
- **Session management** with auth state listener
- **New accounts start with 0** followers, following, posts
- **Protected routes** — redirect unauthenticated users to login

## Phase 2: Database Schema
- **profiles** — username, display name, bio, avatar_url, website, private account flag
- **posts** — image/video URL, caption, hashtags, created_at, user_id
- **stories** — media URL, created_at, expires_at (24h), user_id
- **reels** — video URL, caption, user_id
- **likes** — post_id, user_id
- **comments** — post_id, user_id, text
- **saves** — post_id, user_id
- **follows** — follower_id, following_id, status (for private accounts)
- **messages** / **conversations** — real-time DMs
- **notifications** — type, actor, target, read status
- **user_roles** — admin role management (secure, separate table)

## Phase 3: User Profiles
- **Profile page** — avatar, bio, post grid, follower/following counts
- **Edit profile** — update name, bio, website, avatar upload via Cloudinary
- **Profile picture upload** with crop/preview
- **View other users' profiles** with follow button

## Phase 4: Posts & Feed
- **Create post** — upload image/video to Cloudinary, add caption & hashtags
- **Home feed** — chronological posts from followed users
- **Like, comment, save** functionality on each post
- **Post detail view** with full comments thread
- **Delete own posts**

## Phase 5: Stories & Reels
- **Stories** — upload media, auto-expire after 24 hours (background cleanup)
- **Story viewer** with progress bar, tap to advance
- **Story ring** on profile avatars in feed
- **Reels** — vertical video feed with like/comment/share
- **Reels tab** on profile

## Phase 6: Social Features
- **Follow/unfollow** system with follower/following counts
- **Private accounts** — follow requests with accept/decline
- **Explore page** — discover posts, search by username/hashtag
- **Hashtag pages** — view all posts with a given hashtag

## Phase 7: Messaging & Notifications
- **Direct messages** — real-time chat using Supabase Realtime subscriptions
- **Conversation list** with last message preview
- **Message read receipts**
- **Real-time notifications** — likes, comments, follows, DMs
- **Notification bell** with unread count badge

## Phase 8: Settings Page (Complete)
- **Edit Profile** section
- **Apps and Websites** — connected apps management
- **Notifications** — push notification preferences (likes, comments, follows, DMs)
- **Privacy and Security** — private account toggle, blocked users, two-factor info
- **Login Activity** — recent login sessions with device/location
- **Change Password**
- **Delete Account** — with confirmation flow
- **Dark/Light Mode** toggle

## Phase 9: Admin Dashboard
- **Admin role** via secure user_roles table
- **Dashboard** — user stats, post stats, reported content
- **User management** — view, suspend, delete users
- **Content moderation** — review reported posts

## Phase 10: Polish & Responsive UI
- **Mobile-first responsive design** — identical experience on all devices
- **Bottom navigation bar** on mobile (Home, Search, Create, Reels, Profile)
- **Sidebar navigation** on desktop with Instagram logo + "Network" branding
- **Dark/light mode** with system preference detection
- **Loading skeletons**, smooth transitions, toast notifications
- **Cloudinary integration** for all media (images, videos)

---

## Tech Stack
- **Frontend**: React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Lovable Cloud (Supabase — auth, database, real-time, edge functions)
- **Media Storage**: Cloudinary (image/video uploads)
- **Real-time**: Supabase Realtime for messages & notifications

