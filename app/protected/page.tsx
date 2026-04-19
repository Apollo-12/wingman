import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserFlights, countUserFlights } from "@/lib/flights/queries";

async function FlightsContent() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    redirect("/auth/login");
  }

  const [{ data: flights, error: flightsError }, { count }] = await Promise.all(
    [getUserFlights(supabase), countUserFlights(supabase)],
  );

  if (flightsError) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
        <h2 className="text-lg font-semibold text-destructive">
          Couldn&apos;t load your flights
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {flightsError.message}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome aboard, {userData.user.email}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {count ?? 0} flights logged.
        </p>
      </div>

      {flights && flights.length > 0 ? (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Flight</th>
                <th className="px-4 py-3 font-medium">From</th>
                <th className="px-4 py-3 font-medium">To</th>
                <th className="px-4 py-3 font-medium">Aircraft</th>
                <th className="px-4 py-3 text-right font-medium">Distance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {flights.map((flight) => (
                <tr key={flight.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 tabular-nums">
                    {flight.scheduled_date}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {flight.airline?.iata_code}
                    {flight.flight_number}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">
                      {flight.departure_airport?.iata_code}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {flight.departure_airport?.city}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium">
                      {flight.arrival_airport?.iata_code}
                    </span>{" "}
                    <span className="text-muted-foreground">
                      {flight.arrival_airport?.city}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {flight.aircraft_type?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {flight.distance_km
                      ? `${flight.distance_km.toLocaleString()} km`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border p-6">
          <h2 className="text-lg font-semibold">No flights yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Soon you&apos;ll be able to import your Flighty CSV or add flights
            manually.
          </p>
        </div>
      )}
    </div>
  );
}

export default function ProtectedPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading your flights…</div>}>
      <FlightsContent />
    </Suspense>
  );
}
