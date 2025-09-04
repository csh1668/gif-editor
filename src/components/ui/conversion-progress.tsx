import { Progress } from "@/components/ui/progress";

interface ConversionProgressProps {
  progress: number;
  isVisible: boolean;
}

export default function ConversionProgress({
  progress,
  isVisible,
}: ConversionProgressProps) {
  if (!isVisible) return null;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>변환 진행률</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} className="w-full" />
    </div>
  );
}
