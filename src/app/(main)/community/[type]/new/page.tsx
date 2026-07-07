"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createFreePost,
  createReviewPost,
  createEducationPost,
} from "@/lib/api/community";
import { uploadImage } from "@/lib/api/files";
import { toast } from "sonner";
import { ArrowLeft, Upload, X } from "lucide-react";

export default function NewPostPage() {
  const params = useParams<{ type: string }>();
  const router = useRouter();
  const type = params.type;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [siteName, setSiteName] = useState("");
  const [rating, setRating] = useState(5);
  const [objectName, setObjectName] = useState("");
  const [difficulty, setDifficulty] = useState("BEGINNER");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const typeLabel =
    type === "review"
      ? "관측 리뷰"
      : type === "program"
        ? "교육 프로그램"
        : "자유게시판";

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const res = await uploadImage(file);
        setImageUrls((prev) => [...prev, res.imageUrl]);
      }
    } catch {
      toast.error("이미지 업로드에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  }

  function removeImage(idx: number) {
    setImageUrls((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let postId: number;
      if (type === "review") {
        const res = await createReviewPost({
          title,
          content,
          siteName,
          rating,
          imageUrls,
        });
        postId = res.id;
      } else if (type === "program") {
        const res = await createEducationPost({
          title,
          content,
          objectName,
          difficulty,
          imageUrls,
        });
        postId = res.id;
      } else {
        const res = await createFreePost({ title, content, imageUrls });
        postId = res.id;
      }
      toast.success("게시글이 작성되었습니다.");
      router.replace(`/community/${type}/${postId}`);
    } catch {
      toast.error("게시글 작성에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> 돌아가기
      </button>

      <h1 className="mb-4 text-xl font-bold text-foreground">
        {typeLabel} 글쓰기
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">제목</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {type === "review" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="siteName">관측지 이름</Label>
              <Input
                id="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">평점 (1~5)</Label>
              <Input
                id="rating"
                type="number"
                min={1}
                max={5}
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                required
              />
            </div>
          </>
        )}

        {type === "program" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="objectName">천체 이름</Label>
              <Input
                id="objectName"
                value={objectName}
                onChange={(e) => setObjectName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="difficulty">난이도</Label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="BEGINNER">초급</option>
                <option value="INTERMEDIATE">중급</option>
                <option value="ADVANCED">고급</option>
              </select>
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="content">내용</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px]"
            required
          />
        </div>

        {/* 이미지 업로드 */}
        <div className="space-y-2">
          <Label>이미지</Label>
          <div className="flex flex-wrap gap-2">
            {imageUrls.map((url, i) => (
              <div key={i} className="group relative h-20 w-20">
                <img
                  src={url}
                  alt=""
                  className="h-full w-full rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  aria-label="이미지 삭제"
                  className="absolute -right-1 -top-1 rounded-full bg-error p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border border-dashed border-border hover:border-purple-500">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          </div>
          {isUploading && (
            <p className="text-xs text-muted-foreground">업로드 중...</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? "작성 중..." : "게시글 작성"}
        </Button>
      </form>
    </div>
  );
}
