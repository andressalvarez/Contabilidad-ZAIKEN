import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class NavigationPlacementDto {
  @IsString()
  itemKey: string;

  @IsInt()
  @Min(0)
  order: number;

  @IsBoolean()
  @IsOptional()
  shortcut?: boolean;
}

export class NavigationSectionDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsInt()
  @Min(0)
  order: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NavigationPlacementDto)
  items: NavigationPlacementDto[];
}

export class NavigationWorldDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  order: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NavigationSectionDto)
  sections: NavigationSectionDto[];
}

export class UpdateNavigationLayoutDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  version?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NavigationWorldDto)
  worlds: NavigationWorldDto[];
}
