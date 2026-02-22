import { auth } from "@/auth";
import RecordPage from "@/components/RecordPage";
import { getUserActiveBusiness } from "@/db/service/business";
import { createEntry } from "@/db/service/sale-entry";
import { getBusinessSheets } from "@/db/service/sale-sheet";
import { getUser } from "@/db/service/user";

export default async function page() {
  const session = await auth();

  if (!session) {
    // redirect("/signin");
    return "Loading";
  }

  const business = await getUserActiveBusiness(session.user.id);
  const sheets = await getBusinessSheets(business!.id);

  return (
    <RecordPage
      activeBusiness={business!}
      sheets={sheets}
      onSave={async (data) => {
        "use server";
        await createEntry(data);
        // console.log(data);
        // await saveSaleItems({ items, transcription, sheetId });
      }}
    />
  );
}
