import { Progress, type BitProgressProps } from "@/components/ui/8bit/progress";

interface ManaBarProps extends React.ComponentProps<"div"> {
  className?: string;
  props?: BitProgressProps;
  variant?: "retro" | "default";
  value?: number;
  progressBg?: string;
}

export default function HealthBar({
  className,
  variant,
  value,
  progressBg = "bg-red-500",
  ...props
}: ManaBarProps) {
  return (
    <Progress
      {...props}
      value={value}
      variant={variant}
      className={className}
      progressBg={progressBg}
    />
  );
}
