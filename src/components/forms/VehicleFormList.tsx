import { Plus, Trash2 } from "lucide-react";

export type VehicleFormType = {
  id?: string;
  year: string;
  make: string;
  model: string;
  vin: string;
  operable: boolean;
  trailer_type: string;
};

interface VehicleFormListProps {
  vehicles: VehicleFormType[];
  onChange: (vehicles: VehicleFormType[]) => void;
  maxVehicles?: number;
}

export function VehicleFormList({ vehicles, onChange, maxVehicles = 5 }: VehicleFormListProps) {
  const addVehicle = () => {
    if (vehicles.length < maxVehicles) {
      onChange([...vehicles, { year: "", make: "", model: "", vin: "", operable: true, trailer_type: "Open" }]);
    }
  };

  const removeVehicle = (index: number) => {
    onChange(vehicles.filter((_, i) => i !== index));
  };

  const updateVehicle = (index: number, field: keyof VehicleFormType, value: string | boolean) => {
    const newVehicles = [...vehicles];
    newVehicles[index] = { ...newVehicles[index], [field]: value };
    onChange(newVehicles);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4 border-b border-border/50 pb-2">
        <h3 className="text-lg font-bold text-neon-blue">Vehicles</h3>
        {vehicles.length < maxVehicles && (
          <button 
            type="button" 
            onClick={addVehicle}
            className="flex items-center gap-1 text-sm bg-neon-blue/10 text-neon-blue px-3 py-1 rounded-lg hover:bg-neon-blue/20 transition-colors"
          >
            <Plus size={14} /> Add Vehicle
          </button>
        )}
      </div>

      <div className="space-y-4">
        {vehicles.map((vehicle, index) => (
          <div key={index} className="p-4 bg-foreground/5 rounded-xl border border-border relative">
            {vehicles.length > 1 && (
              <button 
                type="button" 
                onClick={() => removeVehicle(index)} 
                className="absolute top-4 right-4 text-red-500 hover:bg-red-500/10 p-1 rounded"
              >
                <Trash2 size={16} />
              </button>
            )}
            <h4 className="text-sm font-bold mb-3">Vehicle {index + 1}</h4>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div className="md:col-span-1">
                <label className="block text-xs font-medium mb-1">Year</label>
                <input required value={vehicle.year} onChange={(e) => updateVehicle(index, 'year', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm" placeholder="2024" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium mb-1">Make</label>
                <input required value={vehicle.make} onChange={(e) => updateVehicle(index, 'make', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm" placeholder="Ford" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium mb-1">Model</label>
                <input required value={vehicle.model} onChange={(e) => updateVehicle(index, 'model', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm" placeholder="F-150" />
              </div>
              <div className="md:col-span-1">
                <label className="block text-xs font-medium mb-1">VIN</label>
                <input value={vehicle.vin} onChange={(e) => updateVehicle(index, 'vin', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-sm" placeholder="Optional" />
              </div>
              
              <div className="md:col-span-3 flex items-center gap-2 mt-2">
                <label className="text-sm font-medium">Condition:</label>
                <select value={vehicle.operable ? "true" : "false"} onChange={(e) => updateVehicle(index, 'operable', e.target.value === "true")} className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm">
                  <option value="true">Operable</option>
                  <option value="false">Inoperable</option>
                </select>
              </div>
              <div className="md:col-span-3 flex items-center gap-2 mt-2">
                <label className="text-sm font-medium">Trailer Type:</label>
                <select value={vehicle.trailer_type} onChange={(e) => updateVehicle(index, 'trailer_type', e.target.value)} className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm">
                  <option value="Open">Open</option>
                  <option value="Enclosed">Enclosed</option>
                  <option value="Flatbed">Flatbed</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
