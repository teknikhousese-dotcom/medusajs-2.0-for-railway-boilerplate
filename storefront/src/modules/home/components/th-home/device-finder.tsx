import { getDeviceFinderData } from "./device-finder-data"
import DeviceFinderClient from "./device-finder-client"

/*
   "Hitta rätt del till din telefon": rubrik, ingress och enhetsväljaren i
   startsidans hero. Serverdelen hämtar det smala märke/modell-trädet, själva
   väljaren är en klientkomponent.
 */
export default async function DeviceFinder({ regionId }: { regionId?: string }) {
  const data = await getDeviceFinderData()
  const models = data?.counted ? data.models : 0
  const brands = data?.brands.length || 0
  const rounded = models >= 20 ? Math.floor(models / 10) * 10 : 0
  return (
    <>
      <h1>Hitta rätt del<br />till <span className="red">din telefon.</span></h1>
      <p className="lead">
        Skärmar, batterier, baksidor och alla små delar däremellan, sorterade efter modell
        {rounded ? <> (över {rounded} modeller från {brands} märken)</> : null}. Välj din telefon så visar vi det vi har till just den.
      </p>
      <DeviceFinderClient data={data} regionId={regionId} />
    </>
  )
}
