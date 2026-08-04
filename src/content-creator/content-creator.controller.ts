import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContentCreatorService } from './content-creator.service';
import { CreateContentCreatorDto } from './dto/create-content-creator.dto';
import { UpdateContentCreatorDto } from './dto/update-content-creator.dto';
import { CloudinaryService } from 'src/cloudinary/cloudinary.config';

@ApiTags('content-creator')
@Controller('content-creator')
export class ContentCreatorController {
  constructor(
    private readonly contentCreatorService: ContentCreatorService,
    private readonly cloudinaryservice: CloudinaryService,
  ) {}

  @Post('CreateCreator')
  @UseInterceptors(FileInterceptor('profileImage'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create a content creator and sync social follower counts',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'category'],
      properties: {
        name: { type: 'string' },
        category: { type: 'string' },
        instagramProfileUrl: {
          type: 'string',
          example: 'https://www.instagram.com/chris_d/',
        },
        instagramVerified: { type: 'boolean' },
        tiktokProfileUrl: {
          type: 'string',
          example: 'https://www.tiktok.com/@chris_d',
        },
        tiktokVerified: { type: 'boolean' },
        profileImage: { type: 'string', format: 'binary' },
      },
    },
  })
  async create(
    @Body() createContentCreatorDto: CreateContentCreatorDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const imageUrl = file
      ? await this.cloudinaryservice.uploadImage(file)
      : undefined;
    return this.contentCreatorService.create(createContentCreatorDto, imageUrl);
  }

  @Get('AllCreators')
  @ApiOperation({ summary: 'List all content creators (followers from DB only)' })
  findAll() {
    return this.contentCreatorService.findAll();
  }

  @Post('sync-all-followers')
  @ApiOperation({
    summary: 'Manually sync follower counts for all creators',
  })
  syncAllFollowers() {
    return this.contentCreatorService.syncAllFollowers();
  }

  @Post(':id/sync-followers')
  @ApiOperation({
    summary: 'Manually sync follower counts for one creator',
  })
  syncFollowers(@Param('id', ParseIntPipe) id: number) {
    return this.contentCreatorService.syncFollowers(id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contentCreatorService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a content creator; re-syncs followers when profile URLs change',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContentCreatorDto: UpdateContentCreatorDto,
  ) {
    return this.contentCreatorService.update(id, updateContentCreatorDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contentCreatorService.remove(id);
  }
}
