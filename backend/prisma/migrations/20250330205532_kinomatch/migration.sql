-- CreateTable
CREATE TABLE "actors" (
    "actor_id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "bio" TEXT,
    "country_id" INTEGER,
    "photo_filename" VARCHAR(255),

    CONSTRAINT "actors_pkey" PRIMARY KEY ("actor_id")
);

-- CreateTable
CREATE TABLE "countries" (
    "country_id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("country_id")
);

-- CreateTable
CREATE TABLE "directors" (
    "director_id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "bio" TEXT,
    "country_id" INTEGER,
    "photo_filename" VARCHAR(255),

    CONSTRAINT "directors_pkey" PRIMARY KEY ("director_id")
);

-- CreateTable
CREATE TABLE "genres" (
    "genre_id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("genre_id")
);

-- CreateTable
CREATE TABLE "movie_actors" (
    "movie_id" INTEGER NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "character_name" VARCHAR(255),

    CONSTRAINT "movie_actors_pkey" PRIMARY KEY ("movie_id","actor_id")
);

-- CreateTable
CREATE TABLE "movie_directors" (
    "movie_id" INTEGER NOT NULL,
    "director_id" INTEGER NOT NULL,

    CONSTRAINT "movie_directors_pkey" PRIMARY KEY ("movie_id","director_id")
);

-- CreateTable
CREATE TABLE "movie_genres" (
    "movie_id" INTEGER NOT NULL,
    "genre_id" INTEGER NOT NULL,

    CONSTRAINT "movie_genres_pkey" PRIMARY KEY ("movie_id","genre_id")
);

-- CreateTable
CREATE TABLE "movies" (
    "movie_id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "original_title" VARCHAR(255),
    "year" INTEGER,
    "description" TEXT,
    "kinomatch_rating" DECIMAL(3,1),
    "imdb_rating" DECIMAL(3,1),
    "country_id" INTEGER,
    "poster_filename" VARCHAR(255),
    "trailer_filename" VARCHAR(255),

    CONSTRAINT "movies_pkey" PRIMARY KEY ("movie_id")
);

-- CreateTable
CREATE TABLE "user_movie_favorites" (
    "user_id" INTEGER NOT NULL,
    "movie_id" INTEGER NOT NULL,
    "added_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_movie_favorites_pkey" PRIMARY KEY ("user_id","movie_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "registration_date" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_name_key" ON "countries"("name");

-- CreateIndex
CREATE UNIQUE INDEX "genres_name_key" ON "genres"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "actors" ADD CONSTRAINT "actors_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("country_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "directors" ADD CONSTRAINT "directors_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("country_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movie_actors" ADD CONSTRAINT "movie_actors_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "actors"("actor_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movie_actors" ADD CONSTRAINT "movie_actors_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("movie_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movie_directors" ADD CONSTRAINT "movie_directors_director_id_fkey" FOREIGN KEY ("director_id") REFERENCES "directors"("director_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movie_directors" ADD CONSTRAINT "movie_directors_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("movie_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("genre_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movie_genres" ADD CONSTRAINT "movie_genres_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("movie_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movies" ADD CONSTRAINT "movies_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("country_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_movie_favorites" ADD CONSTRAINT "user_movie_favorites_movie_id_fkey" FOREIGN KEY ("movie_id") REFERENCES "movies"("movie_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_movie_favorites" ADD CONSTRAINT "user_movie_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
