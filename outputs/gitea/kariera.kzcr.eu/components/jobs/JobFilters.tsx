import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { JobFilters as JobFiltersType } from "@/types/job";
import { useOrganizations, useContractTypes, useJobRoles, useClassifications } from "@/hooks/useFilterData";
import { normalizeSeatLocation } from "@/lib/hospitalLocations";
import { trackUmamiEvent } from "@/lib/analytics/umami";

interface JobFiltersProps {
  filters: JobFiltersType;
  onFiltersChange: (filters: JobFiltersType) => void;
  onClearFilters: () => void;
}

export function JobFilters({ filters, onFiltersChange, onClearFilters }: JobFiltersProps) {
  const { organizations, loading: orgLoading } = useOrganizations();
  const { contractTypes, loading: contractLoading } = useContractTypes();
  const roleOrganizationId = filters.org
    || organizations.find((org) => {
      const orgSeatLocation = normalizeSeatLocation(org.seat_location);
      const filterSeatLocation = normalizeSeatLocation(filters.location);
      return !!orgSeatLocation && orgSeatLocation === filterSeatLocation;
    })?.id;
  const { jobRoles, loading: rolesLoading } = useJobRoles(roleOrganizationId);
  const { classifications, loading: classificationsLoading } = useClassifications();

  // Local state for salary inputs to enable debouncing
  const [salaryMin, setSalaryMin] = useState(filters.salaryMin?.toString() || '');
  const [salaryMax, setSalaryMax] = useState(filters.salaryMax?.toString() || '');

  // Sync local state with filters when filters change from outside
  useEffect(() => {
    setSalaryMin(filters.salaryMin?.toString() || '');
    setSalaryMax(filters.salaryMax?.toString() || '');
  }, [filters.salaryMin, filters.salaryMax]);

  // Debounce salary changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const minValue = salaryMin ? Number(salaryMin) : undefined;
      const maxValue = salaryMax ? Number(salaryMax) : undefined;
      
      if (minValue !== filters.salaryMin || maxValue !== filters.salaryMax) {
        onFiltersChange({
          ...filters,
          salaryMin: minValue,
          salaryMax: maxValue
        });
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [salaryMin, salaryMax, filters, onFiltersChange]);

  const trackFilterChange = (filterName: string, value?: string) => {
    trackUmamiEvent("job_filter_change", {
      filter_name: filterName,
      value: value || "all",
    });
  };

  const handleFilterChange = (key: keyof JobFiltersType, value: string | number | boolean | undefined) => {
    const newFilters = { ...filters, [key]: value || undefined };
    
    // If organization changes, clear the role filter
    if (key === 'org' || key === 'location') {
      newFilters.role = undefined;
    }

    if (key === "classification") {
      trackFilterChange("classification", typeof value === "string" ? value : undefined);
    } else if (key === "role") {
      trackFilterChange("role", typeof value === "string" ? value : undefined);
    } else if (key === "contractType") {
      trackFilterChange("contract_type", typeof value === "string" ? value : undefined);
    }

    onFiltersChange(newFilters);
  };

  // Job roles are already filtered by backend based on organizationId
  const availableRoles = Array.isArray(jobRoles) ? jobRoles : [];
  const selectedOrganizationValue = (() => {
    if (filters.location) {
      const normalized = normalizeSeatLocation(filters.location);
      if (normalized) return `location:${normalized}`;
    }

    if (filters.org) {
      const orgSeatLocation = normalizeSeatLocation(organizations.find((org) => org.id === filters.org)?.seat_location);
      if (orgSeatLocation) return `location:${orgSeatLocation}`;
      return `org:${filters.org}`;
    }

    return 'all';
  })();

  const handleOrganizationChange = (value: string) => {
    if (value === 'all') {
      trackFilterChange("location");
      onFiltersChange({
        ...filters,
        org: undefined,
        location: undefined,
        role: undefined
      });
      return;
    }

    if (value.startsWith('location:')) {
      const location = normalizeSeatLocation(value.slice('location:'.length));
      trackFilterChange("location", location || undefined);
      onFiltersChange({
        ...filters,
        org: undefined,
        location: location || undefined,
        role: undefined
      });
      return;
    }

    if (value.startsWith('org:')) {
      const org = value.slice('org:'.length);
      const organizationName = organizations.find((item) => item.id === org)?.name;
      trackFilterChange("location", organizationName || org || undefined);
      onFiltersChange({
        ...filters,
        org: org || undefined,
        location: undefined,
        role: undefined
      });
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6 h-fit">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold">Filtry</h2>
        <Button variant="link" className="text-[var(--color-purple)] p-0 h-auto cursor-pointer" onClick={onClearFilters}>
          Vymazat vše
        </Button>
      </div>

      {/* Classification Chips */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Zařazení</h3>
        <div className="flex flex-wrap gap-2">
          {classificationsLoading ? (
            <p className="text-sm text-gray-500">Načítání...</p>
          ) : (
            classifications.map((classification) => (
              <Badge
                key={classification.code}
                variant={filters.classification === classification.code ? "default" : "outline"}
                className={`cursor-pointer transition-colors ${
                  filters.classification === classification.code
                    ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
                    : "hover:bg-[var(--color-info-bg)] hover:border-[var(--primary)]"
                }`}
                onClick={() =>
                  handleFilterChange(
                    'classification',
                    filters.classification === classification.code ? undefined : classification.code
                  )
                }
              >
                {classification.label}
              </Badge>
            ))
          )}
        </div>
      </div>

      {/* Organization */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Lokalita</h3>
        <Select
          value={selectedOrganizationValue}
          onValueChange={handleOrganizationChange}
          disabled={orgLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={orgLoading ? "Načítání..." : "Vyberte"} className="truncate" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny lokality</SelectItem>
            {organizations.map((org) => (
              <SelectItem key={org.id} value={normalizeSeatLocation(org.seat_location) ? `location:${normalizeSeatLocation(org.seat_location)}` : `org:${org.id}`}>
                <div className="truncate max-w-[200px]" title={org.name}>
                  {org.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Job Role (depends on organization) */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Pozice</h3>
        <Select 
          value={filters.role || 'all'} 
          onValueChange={(value) => handleFilterChange('role', value === 'all' ? undefined : value)}
          disabled={rolesLoading || !roleOrganizationId}
        >
          <SelectTrigger>
            <SelectValue 
              placeholder={
                rolesLoading ? "Načítání..." :
                !roleOrganizationId ? "Nejdříve vyberte nemocnici" :
                "Vyberte pozici"
              } 
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny pozice</SelectItem>
            {availableRoles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contract Type */}
      <div className="mb-6">
        <h3 className="font-medium mb-3">Typ úvazku</h3>
        <Select 
          value={filters.contractType || 'all'} 
          onValueChange={(value) => handleFilterChange('contractType', value === 'all' ? undefined : value)}
          disabled={contractLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={contractLoading ? "Načítání..." : "Vyberte typ úvazku"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všechny typy</SelectItem>
            {contractTypes.map((type) => (
              <SelectItem key={type.code} value={type.code}>
                {type.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Salary Range - schováno zatím, protože ho nechtějí */}
      <div className="mb-6" hidden>
        <h3 className="font-medium mb-3">Platové rozpětí (Kč)</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Od</label>
            <Input
              type="number"
              placeholder="25,000"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Do</label>
            <Input
              type="number"
              placeholder="80,000"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Accreditation Filter - taky nechtějí*/}
      <div className="mb-6" hidden>
        <h3 className="font-medium mb-3">Akreditované oddělení</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="accredited"
            checked={filters.accredited || false}
            onCheckedChange={(checked: boolean) => handleFilterChange('accredited', checked ? true : undefined)}
          />
          <Label htmlFor="accredited" className="text-sm text-gray-600 cursor-pointer">
            Pouze akreditované oddělení
          </Label>
        </div>
      </div>
    </div>
  );
}
