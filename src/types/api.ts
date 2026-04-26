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

// apiFetch 자동 unwrap 이후 LoginResponse는 AuthTokens 자체
export type LoginResponse = AuthTokens;

// SignupRequestDto: nickname/birthdate optional, phone required
export interface SignUpRequest {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  phone: string;
  nickname?: string;
}

export interface SignUpResponse {
  message: string;
}

// FindEmailRequestDto: name + phone 필수
export interface FindEmailRequest {
  name: string;
  phone: string;
}

export interface FindEmailResponse {
  email: string;
}

export interface ResetPasswordToEmailRequest {
  email: string;
}

// ChangePasswordRequest
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

// UserMeResponseDto
export interface UserProfile {
  id: number;
  email: string;
  name: string;
  phone: string;
  nickname?: string | null;
  birthdate?: string | null;
  emailVerified: boolean;
  lastLoginAt?: string | null;
  roles: string[];
  createdAt: string;
  updatedAt: string;
  profileImageUrl?: string | null;
  onboardingRequired: boolean;
}

// UserUpdateRequestDto
export interface UpdateUserProfile {
  nickname?: string;
  birthdate?: string;
  phone?: string;
}

export interface ProfileImageResponse {
  imageUrl: string;
}

// Community — PostSummaryResponse (통합 목록 응답)
export interface PostSummary {
  id: number;
  type: string;
  title: string;
  contentSummary: string;
  authorId: number;
  authorNickname: string;
  authorProfileImageUrl?: string | null;
  observationSiteId?: number | null;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  liked: boolean;
  score?: number | null;
  thumbnailUrl?: string | null;
}

// 타입별 별칭 (API는 통합 스키마 사용)
export type ReviewPostSummary = PostSummary;
export type EducationPostSummary = PostSummary;

export interface PostResponse {
  content: PostSummary[];
  totalPages: number;
  totalElements: number;
  number: number;
}

export type ReviewPostResponse = PostResponse;
export type EducationPostResponse = PostResponse;

export interface ReviewDto {
  location?: string;
  observationSiteId?: number;
  targets?: string[];
  equipment?: string;
  observationDate?: string;
  score?: number;
}

export interface EducationDto {
  difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  targets?: string[];
  tags?: string;
  status?: "DRAFT" | "PUBLISHED";
  averageScore?: number;
  contentUrl?: string;
}

export interface PostDetailResponse {
  id: number;
  type: string;
  title: string;
  content: string;
  authorId: number;
  authorNickname: string;
  authorProfileImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  images: string[];
  review?: ReviewDto;
  education?: EducationDto;
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

// Weather — GET /weather/summary
export interface WeatherSummary {
  suitability: number;
  sky: string;
  temperature: number;
  nextGoodTime?: string;
}

export type ForecastResponse = WeatherSummary;

export interface UltraForecastItem {
  tmef: string;
  t1h: number;
  vec: number;
  wsd: number;
  pty: number;
  rn1: number;
  reh: number;
  sky: number;
  suitability: number;
}

export interface ShortForecastItem {
  tmef: string;
  tmp: number;
  tmx?: number;
  tmn?: number;
  vec: number;
  wsd: number;
  sky: number;
  pty: number;
  pop: number;
  reh: number;
  suitability: number;
}

export interface MidForecastItem {
  tmFc: string;
  tmEf: string;
  sky: string;
  pre: string;
  rnSt: number;
  min: number;
  max: number;
  suitability: number;
}

export interface ForecastData {
  ultraForecastResponse: UltraForecastItem[];
  shortForecastResponse: ShortForecastItem[];
  midCombinedForecastDTO: MidForecastItem[];
}

// Observation Sites — ObservationSiteResponseDto
export interface ObservationSite {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  averageScore?: number | null;
}

// ObservationSiteDetailDto
export interface ObservationSiteDetail {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  reviewCount: number;
  totalLikes: number;
  averageScore: number;
}

export interface ObservationSitePage {
  content: ObservationSite[];
  totalPages: number;
  totalElements: number;
}

// ObservationSiteDto (ADMIN 전용 등록/수정 바디)
export interface ObservationSiteRegisterRequest {
  name: string;
  latitude: number;
  longitude: number;
}

export interface ObservationSiteUpdateRequest {
  name?: string;
  latitude?: number;
  longitude?: number;
}

// Saved Sites — /me/saved-sites
export interface SavedSiteResponse {
  savedSiteId: number;
  siteId?: number | null;
  name: string;
  latitude: number;
  longitude: number;
  isCustom: boolean;
}

// Calendar / Plan — EventResponse
export interface PhotoResponse {
  id: number;
  url: string;
  contentType?: string;
}

export interface PlanDetailDto {
  id: number;
  title: string;
  startAt: string;
  endAt?: string | null;
  targets: string[];
  observationSiteId?: number | null;
  observationSiteName?: string | null;
  lat?: number | null;
  lon?: number | null;
  placeName?: string | null;
  status: string;
  memo?: string | null;
  photos: PhotoResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface MonthDaySummaryDto {
  date: string;
  planned: number;
  completed: number;
  canceled: number;
}

// CreateEventRequest
export interface CreatePlanRequest {
  title: string;
  startAt: string;
  endAt?: string;
  observationSiteId?: number;
  targets?: string[];
  lat?: number;
  lon?: number;
  placeName?: string;
  memo?: string;
  status?: string;
  imageUrls?: string[];
}

// UpdateEventRequest
export interface UpdatePlanRequest {
  title?: string;
  startAt?: string;
  endAt?: string;
  targets?: string[];
  observationSiteId?: number;
  lat?: number;
  lon?: number;
  placeName?: string;
  memo?: string;
  status?: string;
  removeImageIds?: number[];
  addImageUrls?: string[];
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
