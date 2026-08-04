import { Test, TestingModule } from '@nestjs/testing';
import { ContentCreatorController } from './content-creator.controller';
import { ContentCreatorService } from './content-creator.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.config';

describe('ContentCreatorController', () => {
  let controller: ContentCreatorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentCreatorController],
      providers: [
        {
          provide: ContentCreatorService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            syncFollowers: jest.fn(),
            syncAllFollowers: jest.fn(),
          },
        },
        {
          provide: CloudinaryService,
          useValue: {
            uploadImage: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ContentCreatorController>(ContentCreatorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
