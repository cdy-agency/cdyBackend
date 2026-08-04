import { Test, TestingModule } from '@nestjs/testing';
import { ContentCreatorService } from './content-creator.service';
import { PrismaService } from 'src/prisma.service';
import { SocialAccountService } from 'src/social-account/social-account.service';

describe('ContentCreatorService', () => {
  let service: ContentCreatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentCreatorService,
        {
          provide: PrismaService,
          useValue: {
            creator: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: SocialAccountService,
          useValue: {
            upsertAndSync: jest.fn(),
            syncCreatorFollowers: jest.fn(),
            syncAllCreators: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ContentCreatorService>(ContentCreatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
