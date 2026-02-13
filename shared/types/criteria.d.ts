export type PropertyType = 'detached' | 'semi_detached' | 'townhouse' | 'condo' | 'duplex' | 'triplex' | 'multi_family' | 'land' | 'farm' | 'other';
export interface TrackingCriteria {
    regions?: string[];
    municipalities?: string[];
    priceMin?: number;
    priceMax?: number;
    bedroomsMin?: number;
    bedroomsMax?: number;
    bathroomsMin?: number;
    propertyTypes?: PropertyType[];
    mustHave?: {
        garage?: boolean;
        pool?: boolean;
        basement?: boolean;
        ac?: boolean;
        fireplace?: boolean;
    };
    mustNotHave?: {
        pool?: boolean;
    };
    yearBuiltMin?: number;
    yearBuiltMax?: number;
    lotSizeMinSqft?: number;
    livingAreaMinSqft?: number;
}
//# sourceMappingURL=criteria.d.ts.map