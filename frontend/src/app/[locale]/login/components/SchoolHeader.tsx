import Image from "next/image";
import { useTranslations } from "next-intl";

const SchoolHeader = () => {
  
  const t = useTranslations("login.school")

  return (
    <div className="flex items-center gap-3 select-none">
      <div className="h-24 w-24 overflow-hidden rounded-2xl">
        <Image
          alt="School logo"
          className="h-full w-full rounded-xl object-cover"
          height={96}
          src="/images-removebg-preview (1) (1).png"
          width={96}
        />
      </div>

      <div>
        <div className="text-m font-semibold text-white">{ t("name") }</div>
        <div className="text-xs text-white/60">{ t("dashboard") }</div>
      </div>
    </div>
  );
};

export default SchoolHeader;