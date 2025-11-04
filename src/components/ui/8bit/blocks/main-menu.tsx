import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/8bit/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/8bit/card";

interface MenuItem {
  label: string;
  action: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

interface MainMenuProps extends React.ComponentProps<"div"> {
  title?: string;
  description?: string;
  menuItems: MenuItem[];
}

export default function MainMenu({
  className,
  title = "Main Menu",
  description,
  menuItems,
  ...props
}: MainMenuProps) {
  return (
    <Card className={cn(className)} {...props}>
      <CardHeader className="flex flex-col items-center justify-center gap-2">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {menuItems.map((item) => (
            <Button
              key={item.label}
              onClick={item.action}
              variant={item.variant || "default"}
              className="w-full"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
