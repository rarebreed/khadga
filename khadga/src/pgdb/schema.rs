table! {
    accounts (account_id) {
        account_id -> Int4,
        user_id -> Int4,
        account_type -> Nullable<Bpchar>,
        created_on -> Timestamp,
        active -> Bool,
    }
}

table! {
    comments (comment_id) {
        comment_id -> Int4,
        body -> Text,
        user_id -> Int4,
        ref_post_id -> Int4,
        created_on -> Timestamp,
        ref_comment_id -> Nullable<Int4>,
    }
}

table! {
    posts (post_id) {
        post_id -> Int4,
        author_id -> Int4,
        title -> Varchar,
        body -> Text,
        created_on -> Timestamp,
        published -> Bool,
    }
}

table! {
    uploads (upload_id) {
        upload_id -> Int4,
        last_upload_date -> Timestamp,
        file_name -> Varchar,
        user_id -> Int4,
    }
}

table! {
    users (user_id) {
        user_id -> Int4,
        first_name -> Varchar,
        last_name -> Varchar,
        email -> Varchar,
    }
}

joinable!(accounts -> users (user_id));
joinable!(comments -> posts (ref_post_id));
joinable!(comments -> users (user_id));
joinable!(posts -> users (author_id));
joinable!(uploads -> users (user_id));

allow_tables_to_appear_in_same_query!(
    accounts,
    comments,
    posts,
    uploads,
    users,
);
