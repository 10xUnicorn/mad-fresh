import RecipeEditor from "@/components/admin/RecipeEditor";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RecipeEditor recipeId={id} />;
}
