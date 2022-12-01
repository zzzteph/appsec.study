<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class UpdateUserHintsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('user_lab_lesson_question_hints', function (Blueprint $table) {
            $table->foreignId('user_topic_node_id')
      ->constrained()
      ->onUpdate('cascade')
      ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('user_lab_lesson_question_hints', function (Blueprint $table) {
            //
        });
    }
}
