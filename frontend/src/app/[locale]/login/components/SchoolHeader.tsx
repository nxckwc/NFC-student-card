import Image from "next/image";
import { useTranslations } from "next-intl";

const SchoolHeader = () => {
  
  const t = useTranslations("login.school")

  return (
    <div className="flex items-center gap-3 select-none">
      <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-[#f8e7e9] p-1">
        <Image
          alt="School logo"
          className="h-full w-full object-contain"
          height={96}
          src="/images-removebg-preview (1) (1).png"
          width={96}
        />
      </div>

      <div>
        <div className="text-base font-bold text-[#303536]">{ t("name") }</div>
        <div className="mt-1 text-xs text-[#817873]">{ t("dashboard") }</div>
      </div>
    </div>
  );
};

export default SchoolHeader;