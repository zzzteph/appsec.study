<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class ChangeUserQuestionsAddKey extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('user_lab_lesson_questions', function (Blueprint $table) {
            $table->dropColumn('user_id');
			$table->foreignId('user_topic_node_id') ->constrained()  ->onUpdate('cascade')  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('user_lab_lesson_questions', function (Blueprint $table) {
            //
        });
    }
}
