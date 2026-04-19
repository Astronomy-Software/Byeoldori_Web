// 서버 공통 응답 래퍼 — 모든 엔드포인트가 { success, message, data } 구조
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// 레거시 별칭 (기존 코드 호환용)
export type BaseResponse<T> = ApiResponse<T>;

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export type LoginResponse = ApiResponse<AuthTokens>;

export interface SignUpRequest {
  email: string;
  password: string;
  nickname: string;
  name: string;
  consentTerms: boolean;
  consentPrivacy: boolean;
}

export interface SignUpResponse {
  message: string;
}

export interface FindEmailRequest {
  name: string;
}

export interface FindEmailResponse {
  email: string;
}

export interface ResetPasswordToEmailRequest {
  email: string;
}

// User
export interface UserProfile {
  id: number;
  email: string;
  nickname: string;
  name: string;
  profileImageUrl: string | null;
  role: string;
}

export interface UpdateUserProfile {
  nickname?: string;
  name?: string;
}

export interface ProfileImageResponse {
  imageUrl: string;
}

// Community
export interface PostSummary {
  id: number;
  title: string;
  content: string;
  authorNickname: string;
  createdAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  thumbnailUrl?: string;
}

export interface PostResponse {
  content: PostSummary[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface ReviewPostSummary extends PostSummary {
  siteName: string;
  rating: number;
  imageUrls: string[];
}

export interface ReviewPostResponse {
  content: ReviewPostSummary[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface EducationPostSummary extends PostSummary {
  objectName: string;
  difficulty: string;
}

export interface EducationPostResponse {
  content: EducationPostSummary[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface PostDetailResponse {
  id: number;
  type: string;
  title: string;
  content: string;
  authorNickname: string;
  authorProfileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  imageUrls: string[];
  // Review-specific
  siteName?: string;
  rating?: number;
  // Education-specific
  objectName?: string;
  difficulty?: string;
}

export interface CreateFreeRequest {
  title: string;
  content: string;
  imageUrls: string[];
}

export interface CreateReviewRequest {
  title: string;
  content: string;
  siteName: string;
  rating: number;
  imageUrls: string[];
}

export interface CreateEducationRequest {
  title: string;
  content: string;
  objectName: string;
  difficulty: string;
  imageUrls: string[];
}

export interface CreatedPostId {
  postId: number;
}

// Comments
export interface CommentResponse {
  id: number;
  content: string;
  authorNickname: string;
  authorProfileImageUrl: string | null;
  createdAt: string;
  likeCount: number;
  liked: boolean;
  parentId: number | null;
  children: CommentResponse[];
}

export interface CommentsPageResponse {
  content: CommentResponse[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export interface CreateCommentRequest {
  content: string;
  parentId?: number;
}

export interface LikeToggleResponse {
  liked: boolean;
  likeCount: number;
}

// Weather
export interface ForecastResponse {
  location: string;
  forecasts: ForecastItem[];
  suitabilityScore: number;
}

export interface ForecastItem {
  date: string;
  time: string;
  temperature: number;
  humidity: number;
  cloudCover: number;
  precipitation: number;
  windSpeed: number;
}

// Observation Sites
export interface ObservationSite {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  lightPollution: number;
  altitude: number;
  description: string;
}

export interface ObservationSiteRegisterRequest {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  lightPollution: number;
  altitude: number;
  description: string;
}

export interface ObservationSiteUpdateRequest {
  address?: string;
  latitude?: number;
  longitude?: number;
  lightPollution?: number;
  altitude?: number;
  description?: string;
}

export interface ObservationSitesRecommendRequest {
  latitude: number;
  longitude: number;
}

// Calendar / Plan
export interface PlanDetailDto {
  id: number;
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  siteName: string;
  objectName: string;
  status: { name: string } | null;
  observedAt: string | null;
  createdAt: string;
}

export interface MonthDaySummaryDto {
  date: string;
  count: number;
}

export interface CreatePlanRequest {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  siteName: string;
  objectName: string;
}

export interface UpdatePlanRequest {
  title?: string;
  description?: string;
  startAt?: string;
  endAt?: string;
  siteName?: string;
  objectName?: string;
}

export interface ObservationCountDto {
  total: number;
  completed: number;
}

// Feedback / Evaluation
export interface FeedbackRequest {
  rating: number;
  comment: string;
}

// File
export interface FileUploadResponse {
  imageUrl: string;
}

// Star
export interface ReviewResponse {
  id: number;
  title: string;
  content: string;
  authorNickname: string;
  rating: number;
}

export interface EducationResponse {
  id: number;
  title: string;
  content: string;
  objectName: string;
  difficulty: string;
}
