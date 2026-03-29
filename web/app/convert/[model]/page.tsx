import { redirect } from "next/navigation";
import { MODELS, isValidModel } from "@/lib/config/models";

type Props = { params: Promise<{ model: string }> };

export function generateStaticParams() {
  return Object.keys(MODELS).map((model) => ({ model }));
}

export default async function ModelPage({ params }: Props) {
  const { model } = await params;
  const slug = model.toLowerCase();
  if (!isValidModel(slug)) redirect("/convert/chatgpt/notion");
  redirect(`/convert/${slug}/notion`);
}
