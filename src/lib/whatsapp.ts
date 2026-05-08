export const WHATSAPP_PHONE = "5518997962510";
export const DEFAULT_WHATSAPP_TEXT = "Olá! Quero fazer um pedido no Muthala Burguer";

export const buildWhatsAppLink = (text: string = DEFAULT_WHATSAPP_TEXT) => {
  const encodedText = encodeURIComponent(text);
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodedText}`;
};
