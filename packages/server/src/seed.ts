import { createReference } from '@medplum/core';
import { Practitioner, Project, ProjectMembership, User } from '@medplum/fhirtypes';
import { NIL as nullUuid, v5 } from 'uuid';
import { bcryptHashPassword } from './auth/utils';
import { getSystemRepo } from './fhir/repo';
import { globalLogger } from './logger';
import { rebuildR4SearchParameters } from './seeds/searchparameters';
import { rebuildR4StructureDefinitions } from './seeds/structuredefinitions';
import { rebuildR4ValueSets } from './seeds/valuesets';

export const r4ProjectId = v5('R4', nullUuid);

export async function seedDatabase(): Promise<void> {
  globalLogger.info('Seeding database started');
  console.log('Seeding database started');

  if (await isSeeded()) {
    globalLogger.info('Database is already seeded');
    console.log('Database is already seeded');
    return;
  }

  const systemRepo = getSystemRepo();
  globalLogger.info('System repository initialized');
  console.log('System repository initialized');

  const [firstName, lastName, email] = ['Medplum', 'Admin', 'admin@example.com'];
  globalLogger.info(`Using admin credentials: ${email}`);
  console.log(`Using admin credentials: ${email}`);

  const passwordHash = await bcryptHashPassword('medplum_admin');
  globalLogger.info('Password hashed');
  console.log('Password hashed');

  const superAdmin = await systemRepo.createResource<User>({
    resourceType: 'User',
    firstName,
    lastName,
    email,
    passwordHash,
  });
  globalLogger.info('Super admin user created');
  console.log('Super admin user created');

  const superAdminProject = await systemRepo.createResource<Project>({
    resourceType: 'Project',
    name: 'Super Admin',
    owner: createReference(superAdmin),
    superAdmin: true,
    strictMode: true,
  });
  globalLogger.info('Super admin project created');
  console.log('Super admin project created');

  await systemRepo.updateResource<Project>({
    resourceType: 'Project',
    id: r4ProjectId,
    name: 'FHIR R4',
  });
  globalLogger.info('FHIR R4 project updated');
  console.log('FHIR R4 project updated');

  const practitioner = await systemRepo.createResource<Practitioner>({
    resourceType: 'Practitioner',
    meta: {
      project: superAdminProject.id,
    },
    name: [
      {
        given: [firstName],
        family: lastName,
      },
    ],
    telecom: [
      {
        system: 'email',
        use: 'work',
        value: email,
      },
    ],
  });
  globalLogger.info('Practitioner created');
  console.log('Practitioner created');

  await systemRepo.createResource<ProjectMembership>({
    resourceType: 'ProjectMembership',
    project: createReference(superAdminProject),
    user: createReference(superAdmin),
    profile: createReference(practitioner),
    admin: true,
  });
  globalLogger.info('Project membership created');
  console.log('Project membership created');

  await rebuildR4StructureDefinitions();
  globalLogger.info('R4 structure definitions rebuilt');
  console.log('R4 structure definitions rebuilt');

  await rebuildR4ValueSets();
  globalLogger.info('R4 value sets rebuilt');
  console.log('R4 value sets rebuilt');

  await rebuildR4SearchParameters();
  globalLogger.info('R4 search parameters rebuilt');
  console.log('R4 search parameters rebuilt');

  globalLogger.info('Database seeding completed');
  console.log('Database seeding completed');
}

/**
 * Returns true if the database is already seeded.
 * @returns True if already seeded.
 */
function isSeeded(): Promise<User | undefined> {
  const systemRepo = getSystemRepo();
  return systemRepo.searchOne({ resourceType: 'User' });
}
