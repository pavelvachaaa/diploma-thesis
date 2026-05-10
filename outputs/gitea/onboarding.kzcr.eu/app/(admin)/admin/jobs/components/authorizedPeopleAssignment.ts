import { AuthorizedPerson, updateJobAuthorizedPeople } from "@/lib/api/jobs"

const getSyncErrorMessage = (error: unknown, fallbackMessage: string): string => {
  return error instanceof Error ? error.message : fallbackMessage
}

interface AuthorizedPeopleSyncResult {
  authorizedPeople: AuthorizedPerson[]
  error: string | null
}

export const syncAuthorizedPeopleForJob = async (
  jobId: string,
  authorizedPeople: AuthorizedPerson[],
  fallbackMessage: string,
): Promise<AuthorizedPeopleSyncResult> => {
  try {
    const response = await updateJobAuthorizedPeople(jobId, authorizedPeople)
    return {
      authorizedPeople: response.authorized_people || [],
      error: null,
    }
  } catch (error) {
    return {
      authorizedPeople,
      error: getSyncErrorMessage(error, fallbackMessage),
    }
  }
}
