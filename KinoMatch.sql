PGDMP      1                }         	   kinomatch    17.2    17.2 I    R           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            S           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            T           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            U           1262    25348 	   kinomatch    DATABASE     }   CREATE DATABASE kinomatch WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'Russian_Russia.1251';
    DROP DATABASE kinomatch;
                     postgres    false            �            1259    25497    actors    TABLE     �   CREATE TABLE public.actors (
    actor_id integer NOT NULL,
    name character varying(255) NOT NULL,
    bio text,
    country_id integer,
    photo_filename character varying(255)
);
    DROP TABLE public.actors;
       public         heap r       postgres    false            �            1259    25496    actors_actor_id_seq    SEQUENCE     �   CREATE SEQUENCE public.actors_actor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.actors_actor_id_seq;
       public               postgres    false    224            V           0    0    actors_actor_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public.actors_actor_id_seq OWNED BY public.actors.actor_id;
          public               postgres    false    223            �            1259    25465 	   countries    TABLE     m   CREATE TABLE public.countries (
    country_id integer NOT NULL,
    name character varying(100) NOT NULL
);
    DROP TABLE public.countries;
       public         heap r       postgres    false            �            1259    25464    countries_country_id_seq    SEQUENCE     �   CREATE SEQUENCE public.countries_country_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public.countries_country_id_seq;
       public               postgres    false    218            W           0    0    countries_country_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public.countries_country_id_seq OWNED BY public.countries.country_id;
          public               postgres    false    217            �            1259    25511 	   directors    TABLE     �   CREATE TABLE public.directors (
    director_id integer NOT NULL,
    name character varying(255) NOT NULL,
    bio text,
    country_id integer,
    photo_filename character varying(255)
);
    DROP TABLE public.directors;
       public         heap r       postgres    false            �            1259    25510    directors_director_id_seq    SEQUENCE     �   CREATE SEQUENCE public.directors_director_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 0   DROP SEQUENCE public.directors_director_id_seq;
       public               postgres    false    226            X           0    0    directors_director_id_seq    SEQUENCE OWNED BY     W   ALTER SEQUENCE public.directors_director_id_seq OWNED BY public.directors.director_id;
          public               postgres    false    225            �            1259    25488    genres    TABLE     g   CREATE TABLE public.genres (
    genre_id integer NOT NULL,
    name character varying(50) NOT NULL
);
    DROP TABLE public.genres;
       public         heap r       postgres    false            �            1259    25487    genres_genre_id_seq    SEQUENCE     �   CREATE SEQUENCE public.genres_genre_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.genres_genre_id_seq;
       public               postgres    false    222            Y           0    0    genres_genre_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public.genres_genre_id_seq OWNED BY public.genres.genre_id;
          public               postgres    false    221            �            1259    25553    movie_actors    TABLE     �   CREATE TABLE public.movie_actors (
    movie_id integer NOT NULL,
    actor_id integer NOT NULL,
    character_name character varying(255)
);
     DROP TABLE public.movie_actors;
       public         heap r       postgres    false            �            1259    25568    movie_directors    TABLE     i   CREATE TABLE public.movie_directors (
    movie_id integer NOT NULL,
    director_id integer NOT NULL
);
 #   DROP TABLE public.movie_directors;
       public         heap r       postgres    false            �            1259    25538    movie_genres    TABLE     c   CREATE TABLE public.movie_genres (
    movie_id integer NOT NULL,
    genre_id integer NOT NULL
);
     DROP TABLE public.movie_genres;
       public         heap r       postgres    false            �            1259    25474    movies    TABLE     n  CREATE TABLE public.movies (
    movie_id integer NOT NULL,
    title character varying(255) NOT NULL,
    original_title character varying(255),
    year integer,
    description text,
    kinomatch_rating numeric(3,1),
    imdb_rating numeric(3,1),
    country_id integer,
    poster_filename character varying(255),
    trailer_filename character varying(255)
);
    DROP TABLE public.movies;
       public         heap r       postgres    false            �            1259    25473    movies_movie_id_seq    SEQUENCE     �   CREATE SEQUENCE public.movies_movie_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 *   DROP SEQUENCE public.movies_movie_id_seq;
       public               postgres    false    220            Z           0    0    movies_movie_id_seq    SEQUENCE OWNED BY     K   ALTER SEQUENCE public.movies_movie_id_seq OWNED BY public.movies.movie_id;
          public               postgres    false    219            �            1259    25583    user_movie_favorites    TABLE     �   CREATE TABLE public.user_movie_favorites (
    user_id integer NOT NULL,
    movie_id integer NOT NULL,
    added_at timestamp without time zone DEFAULT now()
);
 (   DROP TABLE public.user_movie_favorites;
       public         heap r       postgres    false            �            1259    25525    users    TABLE       CREATE TABLE public.users (
    user_id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    registration_date timestamp without time zone DEFAULT now()
);
    DROP TABLE public.users;
       public         heap r       postgres    false            �            1259    25524    users_user_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.users_user_id_seq;
       public               postgres    false    228            [           0    0    users_user_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;
          public               postgres    false    227            �           2604    25500    actors actor_id    DEFAULT     r   ALTER TABLE ONLY public.actors ALTER COLUMN actor_id SET DEFAULT nextval('public.actors_actor_id_seq'::regclass);
 >   ALTER TABLE public.actors ALTER COLUMN actor_id DROP DEFAULT;
       public               postgres    false    223    224    224            �           2604    25468    countries country_id    DEFAULT     |   ALTER TABLE ONLY public.countries ALTER COLUMN country_id SET DEFAULT nextval('public.countries_country_id_seq'::regclass);
 C   ALTER TABLE public.countries ALTER COLUMN country_id DROP DEFAULT;
       public               postgres    false    217    218    218            �           2604    25514    directors director_id    DEFAULT     ~   ALTER TABLE ONLY public.directors ALTER COLUMN director_id SET DEFAULT nextval('public.directors_director_id_seq'::regclass);
 D   ALTER TABLE public.directors ALTER COLUMN director_id DROP DEFAULT;
       public               postgres    false    225    226    226            �           2604    25491    genres genre_id    DEFAULT     r   ALTER TABLE ONLY public.genres ALTER COLUMN genre_id SET DEFAULT nextval('public.genres_genre_id_seq'::regclass);
 >   ALTER TABLE public.genres ALTER COLUMN genre_id DROP DEFAULT;
       public               postgres    false    222    221    222            �           2604    25477    movies movie_id    DEFAULT     r   ALTER TABLE ONLY public.movies ALTER COLUMN movie_id SET DEFAULT nextval('public.movies_movie_id_seq'::regclass);
 >   ALTER TABLE public.movies ALTER COLUMN movie_id DROP DEFAULT;
       public               postgres    false    220    219    220            �           2604    25528    users user_id    DEFAULT     n   ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);
 <   ALTER TABLE public.users ALTER COLUMN user_id DROP DEFAULT;
       public               postgres    false    228    227    228            G          0    25497    actors 
   TABLE DATA           Q   COPY public.actors (actor_id, name, bio, country_id, photo_filename) FROM stdin;
    public               postgres    false    224   !Y       A          0    25465 	   countries 
   TABLE DATA           5   COPY public.countries (country_id, name) FROM stdin;
    public               postgres    false    218   jZ       I          0    25511 	   directors 
   TABLE DATA           W   COPY public.directors (director_id, name, bio, country_id, photo_filename) FROM stdin;
    public               postgres    false    226   �Z       E          0    25488    genres 
   TABLE DATA           0   COPY public.genres (genre_id, name) FROM stdin;
    public               postgres    false    222   �[       M          0    25553    movie_actors 
   TABLE DATA           J   COPY public.movie_actors (movie_id, actor_id, character_name) FROM stdin;
    public               postgres    false    230   �\       N          0    25568    movie_directors 
   TABLE DATA           @   COPY public.movie_directors (movie_id, director_id) FROM stdin;
    public               postgres    false    231   �\       L          0    25538    movie_genres 
   TABLE DATA           :   COPY public.movie_genres (movie_id, genre_id) FROM stdin;
    public               postgres    false    229   ,]       C          0    25474    movies 
   TABLE DATA           �   COPY public.movies (movie_id, title, original_title, year, description, kinomatch_rating, imdb_rating, country_id, poster_filename, trailer_filename) FROM stdin;
    public               postgres    false    220   m]       O          0    25583    user_movie_favorites 
   TABLE DATA           K   COPY public.user_movie_favorites (user_id, movie_id, added_at) FROM stdin;
    public               postgres    false    232   �`       K          0    25525    users 
   TABLE DATA           [   COPY public.users (user_id, username, email, password_hash, registration_date) FROM stdin;
    public               postgres    false    228   �`       \           0    0    actors_actor_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public.actors_actor_id_seq', 7, true);
          public               postgres    false    223            ]           0    0    countries_country_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.countries_country_id_seq', 7, true);
          public               postgres    false    217            ^           0    0    directors_director_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.directors_director_id_seq', 5, true);
          public               postgres    false    225            _           0    0    genres_genre_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public.genres_genre_id_seq', 9, true);
          public               postgres    false    221            `           0    0    movies_movie_id_seq    SEQUENCE SET     A   SELECT pg_catalog.setval('public.movies_movie_id_seq', 7, true);
          public               postgres    false    219            a           0    0    users_user_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.users_user_id_seq', 1, false);
          public               postgres    false    227            �           2606    25504    actors actors_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.actors
    ADD CONSTRAINT actors_pkey PRIMARY KEY (actor_id);
 <   ALTER TABLE ONLY public.actors DROP CONSTRAINT actors_pkey;
       public                 postgres    false    224            �           2606    25472    countries countries_name_key 
   CONSTRAINT     W   ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_name_key UNIQUE (name);
 F   ALTER TABLE ONLY public.countries DROP CONSTRAINT countries_name_key;
       public                 postgres    false    218            �           2606    25470    countries countries_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.countries
    ADD CONSTRAINT countries_pkey PRIMARY KEY (country_id);
 B   ALTER TABLE ONLY public.countries DROP CONSTRAINT countries_pkey;
       public                 postgres    false    218            �           2606    25518    directors directors_pkey 
   CONSTRAINT     _   ALTER TABLE ONLY public.directors
    ADD CONSTRAINT directors_pkey PRIMARY KEY (director_id);
 B   ALTER TABLE ONLY public.directors DROP CONSTRAINT directors_pkey;
       public                 postgres    false    226            �           2606    25495    genres genres_name_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.genres
    ADD CONSTRAINT genres_name_key UNIQUE (name);
 @   ALTER TABLE ONLY public.genres DROP CONSTRAINT genres_name_key;
       public                 postgres    false    222            �           2606    25493    genres genres_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.genres
    ADD CONSTRAINT genres_pkey PRIMARY KEY (genre_id);
 <   ALTER TABLE ONLY public.genres DROP CONSTRAINT genres_pkey;
       public                 postgres    false    222            �           2606    25557    movie_actors movie_actors_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.movie_actors
    ADD CONSTRAINT movie_actors_pkey PRIMARY KEY (movie_id, actor_id);
 H   ALTER TABLE ONLY public.movie_actors DROP CONSTRAINT movie_actors_pkey;
       public                 postgres    false    230    230            �           2606    25572 $   movie_directors movie_directors_pkey 
   CONSTRAINT     u   ALTER TABLE ONLY public.movie_directors
    ADD CONSTRAINT movie_directors_pkey PRIMARY KEY (movie_id, director_id);
 N   ALTER TABLE ONLY public.movie_directors DROP CONSTRAINT movie_directors_pkey;
       public                 postgres    false    231    231            �           2606    25542    movie_genres movie_genres_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.movie_genres
    ADD CONSTRAINT movie_genres_pkey PRIMARY KEY (movie_id, genre_id);
 H   ALTER TABLE ONLY public.movie_genres DROP CONSTRAINT movie_genres_pkey;
       public                 postgres    false    229    229            �           2606    25481    movies movies_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_pkey PRIMARY KEY (movie_id);
 <   ALTER TABLE ONLY public.movies DROP CONSTRAINT movies_pkey;
       public                 postgres    false    220            �           2606    25588 .   user_movie_favorites user_movie_favorites_pkey 
   CONSTRAINT     {   ALTER TABLE ONLY public.user_movie_favorites
    ADD CONSTRAINT user_movie_favorites_pkey PRIMARY KEY (user_id, movie_id);
 X   ALTER TABLE ONLY public.user_movie_favorites DROP CONSTRAINT user_movie_favorites_pkey;
       public                 postgres    false    232    232            �           2606    25537    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public                 postgres    false    228            �           2606    25533    users users_pkey 
   CONSTRAINT     S   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public                 postgres    false    228            �           2606    25535    users users_username_key 
   CONSTRAINT     W   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);
 B   ALTER TABLE ONLY public.users DROP CONSTRAINT users_username_key;
       public                 postgres    false    228            �           2606    25505    actors actors_country_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.actors
    ADD CONSTRAINT actors_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(country_id);
 G   ALTER TABLE ONLY public.actors DROP CONSTRAINT actors_country_id_fkey;
       public               postgres    false    224    218    4747            �           2606    25519 #   directors directors_country_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.directors
    ADD CONSTRAINT directors_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(country_id);
 M   ALTER TABLE ONLY public.directors DROP CONSTRAINT directors_country_id_fkey;
       public               postgres    false    218    226    4747            �           2606    25563 '   movie_actors movie_actors_actor_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.movie_actors
    ADD CONSTRAINT movie_actors_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.actors(actor_id);
 Q   ALTER TABLE ONLY public.movie_actors DROP CONSTRAINT movie_actors_actor_id_fkey;
       public               postgres    false    224    230    4755            �           2606    25558 '   movie_actors movie_actors_movie_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.movie_actors
    ADD CONSTRAINT movie_actors_movie_id_fkey FOREIGN KEY (movie_id) REFERENCES public.movies(movie_id);
 Q   ALTER TABLE ONLY public.movie_actors DROP CONSTRAINT movie_actors_movie_id_fkey;
       public               postgres    false    230    4749    220            �           2606    25578 0   movie_directors movie_directors_director_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.movie_directors
    ADD CONSTRAINT movie_directors_director_id_fkey FOREIGN KEY (director_id) REFERENCES public.directors(director_id);
 Z   ALTER TABLE ONLY public.movie_directors DROP CONSTRAINT movie_directors_director_id_fkey;
       public               postgres    false    231    4757    226            �           2606    25573 -   movie_directors movie_directors_movie_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.movie_directors
    ADD CONSTRAINT movie_directors_movie_id_fkey FOREIGN KEY (movie_id) REFERENCES public.movies(movie_id);
 W   ALTER TABLE ONLY public.movie_directors DROP CONSTRAINT movie_directors_movie_id_fkey;
       public               postgres    false    231    4749    220            �           2606    25548 '   movie_genres movie_genres_genre_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.movie_genres
    ADD CONSTRAINT movie_genres_genre_id_fkey FOREIGN KEY (genre_id) REFERENCES public.genres(genre_id);
 Q   ALTER TABLE ONLY public.movie_genres DROP CONSTRAINT movie_genres_genre_id_fkey;
       public               postgres    false    222    229    4753            �           2606    25543 '   movie_genres movie_genres_movie_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.movie_genres
    ADD CONSTRAINT movie_genres_movie_id_fkey FOREIGN KEY (movie_id) REFERENCES public.movies(movie_id);
 Q   ALTER TABLE ONLY public.movie_genres DROP CONSTRAINT movie_genres_movie_id_fkey;
       public               postgres    false    4749    220    229            �           2606    25482    movies movies_country_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(country_id);
 G   ALTER TABLE ONLY public.movies DROP CONSTRAINT movies_country_id_fkey;
       public               postgres    false    220    4747    218            �           2606    25594 7   user_movie_favorites user_movie_favorites_movie_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.user_movie_favorites
    ADD CONSTRAINT user_movie_favorites_movie_id_fkey FOREIGN KEY (movie_id) REFERENCES public.movies(movie_id);
 a   ALTER TABLE ONLY public.user_movie_favorites DROP CONSTRAINT user_movie_favorites_movie_id_fkey;
       public               postgres    false    4749    220    232            �           2606    25589 6   user_movie_favorites user_movie_favorites_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.user_movie_favorites
    ADD CONSTRAINT user_movie_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 `   ALTER TABLE ONLY public.user_movie_favorites DROP CONSTRAINT user_movie_favorites_user_id_fkey;
       public               postgres    false    4761    228    232            G   9  x��RMN�@^OO1a�M�[xӖ�
�&�����6�2�t���n���$l�1$����}?ｯ#�J�೐Ң�C�tpro��j��Yp�$�鱵��BKC���9A5��b�;�`9N�AjFfv�\��ޛdX#X<Jc��_��Q�*o*,s*xt�l瓢���[b���������*]j��0Ѿ;�c�V�/�(~��Awj��\��R����ӭ��|s�7V����tǭ�ؠ��Ƶ���V�ՠ���V�����Ԙ$�V�p��o���as!����%��^�<���x���^�3�[Y�f����$I~ � �)      A   l   x�%�1�@E�Ø����0�-��PIBa�h���Wxs#7c������0s�ף0�f%�a�i�]�l9;=	KV�uQ
���Q+��n����0�zu<����T��H�      I     x���AN�@E��)|��-�FO��$U,�b�DEE[�P%0-d�����=U����L��o�V Xi�]��B�O���t[y`%6�g���2��t�Z�ёR��{b���=�9e�C��R�7���n� 0��L��@0gqdy@�����K�W,�~T�:��<>�����!t�]����`AVv��-�}\����=�|�K�R�e�*�ם���dz�&%�_uF�'���f7��U\�����ѿ��w�I�e�(j��      E   �   x�=NI
�@<w?Fp����B.<�x0���1o���59HCCu-]K�_s��pG��<0!#`@���7���d7�AD��u+�R��V�'A�i��vL�ؑ�?��u��\�Cփ�>w��k�j�*�ǅ�� ׂoN      M   U   x�Ǳ� D���)��Ѹ�À�`e,-,mLW��H����*��`<x()0��� .u��n<437�,����mj��r)�      N      x�3�4�2�4�2�4b.NS�=... '�      L   1   x�3�4�2�4�2�4�2��@�(f�M�|306�2� bC�=... �{]      C   ,  x��U�NQ]�~�[IC��2q�1QW.��b	��4BcbԘ��nLܔ�ڙ���#Ϲ�@�q#eB�w�=��s5#%s�Į���+s|Ʈg��u���v��:0�+��F>I.��%�H�VD�q:�k.!���X���x�v=�e�F(���Jh�>В�xX4�Db�N����k�Yr�% 9X�:��ҝYT�FE�'z�	"��"k^5�<S3���[Y5���>v�had��������L�bOd��=ӳ�Ћ���Tk6�F���b_���S�dpCK*P|T���5t�� �bs|�I��Y5uOʚ�ݫQ�����V�}H�kF��	�p��i�1jd�
s+Q�s�)��D�6��R�D��Q��8O���-�ϲ��-"6��+~F�)�Hu�f��kd�����K�ݷݝ�}t�=:h���:��)�Q�q'�tE���[ƞ*�x�#
K��.F��N�<YK�`�;�nH��MIJ=���?I�%g	јh��A��g��v�V�	��Δy4�'=�!�"��T�<(�nt�k�c��F]�*�Ř���Z%��uy����B ���,j��{ㇱ�E(��#-4GV��SRҬ���悒���Jg=Յ����<m�W�ݖm�-�Xdf�̰��b�����K��o�%&Yg��j��X��9)����5�

�{	��D�c��"r�(��:�LO
ӯ��������[O��r���l��C��!~���ޢ:\��7'+'T��Y!�o{��Oξ{�Rn����H����2��u��f�R������      O      x������ � �      K      x������ � �     