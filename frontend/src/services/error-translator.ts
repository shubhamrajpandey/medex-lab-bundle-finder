import type { PlanErrorCode } from '../types/plan';

/**
 * Translates technical API error codes and statuses into polite, plain-language guidance.
 * Rule: A customer never sees a raw error code.
 */
export function translateErrorMessage(
  errorCode: PlanErrorCode | string,
  testIds: string[] = [],
  testNameMap: Map<string, string> = new Map(),
): string {
  const formatNames = (ids: string[]): string => {
    if (ids.length === 0) return '';
    const names = ids.map((id) => testNameMap.get(id) || id);
    if (names.length === 1) return `"${names[0]}"`;
    if (names.length === 2) return `"${names[0]}" and "${names[1]}"`;
    return `${names.slice(0, -1).map((n) => `"${n}"`).join(', ')}, and "${names[names.length - 1]}"`;
  };

  switch (errorCode) {
    case 'EMPTY_SELECTION':
      return 'Please choose one or more lab tests above to see your bundle recommendations and savings.';

    case 'INVALID_TESTS': {
      const details = formatNames(testIds);
      return details
        ? `The following test(s) are currently not available: ${details}. Please remove them from your selection to view available bundles.`
        : 'One or more of the selected tests are currently unavailable. Please remove them to continue.';
    }

    case 'NOT_AVAILABLE': {
      const details = formatNames(testIds);
      return details
        ? `No active package currently covers ${details}. These specific tests are only available when included in a specialized package.`
        : 'No package can cover your current test combination. Please adjust your selection.';
    }

    case 'NETWORK_ERROR':
      return 'Unable to reach the MedEx server. Please check your internet connection or try again in a few moments.';

    case 'INTERNAL_SERVER_ERROR':
      return 'We encountered an issue while calculating your plan. Please try again or refresh the page.';

    default:
      return 'Something went wrong while finding your optimal bundle. Please try again.';
  }
}
