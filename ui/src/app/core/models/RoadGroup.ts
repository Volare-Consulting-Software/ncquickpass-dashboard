/** A group of roads/lanes the API classifies tolls into (drives the toll filters). */
export interface RoadGroup {
  id: string;
  label: string;
  hovEligible: boolean;
}
