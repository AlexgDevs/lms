export interface Course {
  id: number;
  title: string;
  category: string;
  coverUrl: string;
  author: string;
  rating?: number;
  studentsCount?: number;
  durationHours?: number;
  hasCertificate?: boolean;
  price?: number;
  oldPrice?: number;
  discountBadge?: string;
  isFavorite?: boolean;

  // Дополнительные поля для "Моих" и "Создаваемых" курсов
  progress?: number; // % прохождения
  status?: "draft" | "published" | "review"; // статус для авторских
}
