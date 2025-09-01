-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_parcels_updated_at BEFORE UPDATE ON public.parcels
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocks_updated_at BEFORE UPDATE ON public.blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate block areas sum
CREATE OR REPLACE FUNCTION validate_block_areas()
RETURNS TRIGGER AS $$
DECLARE
    total_block_area DECIMAL(10,4);
    parcel_area DECIMAL(10,4);
BEGIN
    -- Get total area of all blocks for this parcel
    SELECT COALESCE(SUM(block_area_ha), 0) INTO total_block_area
    FROM public.blocks 
    WHERE parcel_id = COALESCE(NEW.parcel_id, OLD.parcel_id);
    
    -- Get parcel total area
    SELECT total_parcel_area_ha INTO parcel_area
    FROM public.parcels 
    WHERE id = COALESCE(NEW.parcel_id, OLD.parcel_id);
    
    -- Allow some tolerance (1% difference)
    IF total_block_area > parcel_area * 1.01 THEN
        RAISE EXCEPTION 'Total block area (% ha) exceeds parcel area (% ha)', 
            total_block_area, parcel_area;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create trigger to validate block areas
CREATE TRIGGER validate_block_areas_trigger 
    AFTER INSERT OR UPDATE OR DELETE ON public.blocks
    FOR EACH ROW EXECUTE FUNCTION validate_block_areas();

-- Create function to calculate age in years
CREATE OR REPLACE FUNCTION calculate_age_years(planting_date DATE, valuation_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN FLOOR((valuation_date - planting_date) / 365.0);
END;
$$ language 'plpgsql';
