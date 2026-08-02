import { cookies } from "next/headers";
import { DEFAULT_CUSTOMER_ID, getSampleCustomer } from "@/data/sampleCustomers";
import {
  FREQUENT_COOKIE,
  PURCHASED_COOKIE,
  SEARCHED_COOKIE,
  applyDemoSession,
  scopedList,
} from "@/lib/demoSession";

/**
 * Server-side read of which sample customer the demo is currently viewing as,
 * plus anything that customer has done during the demo itself.
 *
 * Reading a cookie opts these pages out of static prerendering, which is
 * correct — what a customer sees depends on who they are and what they've
 * just bought.
 */
export async function currentDemoCustomer() {
  const store = await cookies();
  const id = store.get("demoCustomer")?.value ?? DEFAULT_CUSTOMER_ID;
  const customer = getSampleCustomer(id);

  return applyDemoSession(customer, {
    purchased: scopedList(store.get(PURCHASED_COOKIE)?.value, customer.id),
    frequent: scopedList(store.get(FREQUENT_COOKIE)?.value, customer.id),
    searched: scopedList(store.get(SEARCHED_COOKIE)?.value, customer.id),
  });
}
