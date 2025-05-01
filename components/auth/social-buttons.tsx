import { Button } from "@/components/ui/button";
import { FaGoogle, FaFacebook, FaApple } from "react-icons/fa";

export function SocialButtons() {
  return (
    <div className="flex flex-col gap-2 w-full">
      <Button variant="outline" className="w-full">
        <FaGoogle className="mr-2" />
        Continue with Google
      </Button>
      <Button variant="outline" className="w-full">
        <FaFacebook className="mr-2" />
        Continue with Facebook
      </Button>
      <Button variant="outline" className="w-full">
        <FaApple className="mr-2" />
        Continue with Apple
      </Button>
    </div>
  );
} 